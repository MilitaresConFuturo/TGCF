#!/usr/bin/env python3
"""Custodia local de la firma TGCF en Windows (sin secretos en el repositorio).

Uso: python scripts/tgcf-signing.py init|status|build|recovery
La contraseña aleatoria se protege con DPAPI CurrentUser; recovery SOLO se
muestra en la consola local del dueño para anotarla fuera del ordenador.
"""
import argparse
import base64
import ctypes
from ctypes import wintypes
import hashlib
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys

if sys.platform != 'win32':
    raise SystemExit('Esta herramienta de custodia requiere Windows.')

ROOT = Path(__file__).resolve().parents[1]
VAULT = Path(os.environ['LOCALAPPDATA']) / 'TGCF-Signing'
KEY = VAULT / 'tgcf-release.p12'
BLOB = VAULT / 'tgcf-password.dpapi'
ALIAS = 'tgcf'

class DATA_BLOB(ctypes.Structure):
    _fields_ = [('cbData', wintypes.DWORD), ('pbData', ctypes.POINTER(ctypes.c_byte))]

crypt32 = ctypes.WinDLL('crypt32', use_last_error=True)
kernel32 = ctypes.WinDLL('kernel32', use_last_error=True)
crypt32.CryptProtectData.argtypes = [ctypes.POINTER(DATA_BLOB), wintypes.LPCWSTR, ctypes.c_void_p,
                                     ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(DATA_BLOB)]
crypt32.CryptProtectData.restype = wintypes.BOOL
crypt32.CryptUnprotectData.argtypes = [ctypes.POINTER(DATA_BLOB), ctypes.c_void_p, ctypes.c_void_p,
                                       ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(DATA_BLOB)]
crypt32.CryptUnprotectData.restype = wintypes.BOOL
kernel32.LocalFree.argtypes = [ctypes.c_void_p]

def protect(raw: bytes, decrypt=False) -> bytes:
    buf = ctypes.create_string_buffer(raw)
    source = DATA_BLOB(len(raw), ctypes.cast(buf, ctypes.POINTER(ctypes.c_byte)))
    dest = DATA_BLOB()
    fn = crypt32.CryptUnprotectData if decrypt else crypt32.CryptProtectData
    description = None if decrypt else 'TGCF Android release signing password'
    if not fn(ctypes.byref(source), description, None, None, None, 1, ctypes.byref(dest)):
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        return ctypes.string_at(dest.pbData, dest.cbData)
    finally:
        kernel32.LocalFree(dest.pbData)

def password():
    return protect(BLOB.read_bytes(), decrypt=True).decode('ascii')

def keytool():
    paths = [Path('C:/Program Files/AutoFirma/Autofirma/jre/bin/keytool.exe')]
    found = shutil.which('keytool')
    if found: paths.insert(0, Path(found))
    for p in paths:
        if p.exists(): return str(p)
    raise SystemExit('Falta keytool (JDK 21).')

def run_keytool(args, pw):
    env = os.environ.copy()
    env['TGCF_SIGNING_PASSWORD'] = pw
    subprocess.run([keytool(), *args], env=env, check=True)

def init():
    if KEY.exists() or BLOB.exists():
        raise SystemExit('Ya hay material de firma. No se sobrescribe ni se rota la clave.')
    VAULT.mkdir(parents=True, exist_ok=True)
    pw = secrets.token_urlsafe(48)
    try:
        run_keytool(['-genkeypair', '-keystore', str(KEY), '-storetype', 'PKCS12',
                     '-alias', ALIAS, '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000',
                     '-dname', 'CN=TGCF, O=Militares con Futuro, C=ES',
                     '-storepass:env', 'TGCF_SIGNING_PASSWORD',
                     '-keypass:env', 'TGCF_SIGNING_PASSWORD', '-noprompt'], pw)
        BLOB.write_bytes(protect(pw.encode('ascii')))
        status()
    except Exception:
        KEY.unlink(missing_ok=True)
        BLOB.unlink(missing_ok=True)
        raise

def status():
    if not KEY.exists() or not BLOB.exists():
        raise SystemExit('Falta la clave o su contraseña protegida; no es posible firmar.')
    print('Clave local:', KEY)
    print('Certificado público (huellas, no secreto):')
    run_keytool(['-list', '-v', '-keystore', str(KEY), '-storetype', 'PKCS12',
                 '-alias', ALIAS, '-storepass:env', 'TGCF_SIGNING_PASSWORD'], password())
    print('SHA-256 del archivo de clave:', hashlib.sha256(KEY.read_bytes()).hexdigest())
    print('DPAPI protege la contraseña para el usuario Windows actual; no viaja a otro PC por sí solo.')

def build():
    pw = password()
    if not KEY.exists(): raise SystemExit('Falta el almacén de firma.')
    env = os.environ.copy()
    env['TGCF_SIGNING_FILE'] = str(KEY)
    env['TGCF_SIGNING_PASSWORD'] = pw
    java = Path(os.environ['LOCALAPPDATA']) / 'TGCF-Toolchain' / 'jdk-21.0.12.1+1'
    if not (java / 'bin' / 'javac.exe').exists():
        raise SystemExit('Falta JDK 21 completo para compilar Android (javac.exe).')
    env['JAVA_HOME'] = str(java)
    env['PATH'] = str(java / 'bin') + os.pathsep + env['PATH']
    sdk = Path(os.environ['LOCALAPPDATA']) / 'TGCF-Toolchain' / 'android-sdk'
    if not (sdk / 'platforms' / 'android-36' / 'android.jar').exists():
        raise SystemExit('Falta Android SDK API 36 para compilar.')
    env['ANDROID_HOME'] = str(sdk)
    env['ANDROID_SDK_ROOT'] = str(sdk)
    subprocess.run(['npm.cmd', 'run', 'mobile:sync'], cwd=ROOT, env=env, check=True)
    subprocess.run([str(ROOT / 'android' / 'gradlew.bat'), 'assembleRelease', '--no-daemon'],
                   cwd=ROOT / 'android', env=env, check=True)

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('action', choices=['init','status','build','recovery'])
a = p.parse_args()
if a.action == 'init': init()
elif a.action == 'status': status()
elif a.action == 'build': build()
else:
    # Local-only window: avoids leaking the recovery phrase into a terminal log.
    import tkinter as tk
    window = tk.Tk()
    window.title('Recuperación de firma TGCF')
    window.geometry('740x210')
    tk.Label(window, text='Solo para el titular: anótala fuera del PC o en un gestor seguro.\nNO la envíes por chat/correo ni hagas capturas.',
             justify='left', padx=18, pady=16).pack(anchor='w')
    value = tk.StringVar(value='(oculta)')
    tk.Entry(window, textvariable=value, width=75, state='readonly', readonlybackground='white').pack(padx=18, pady=6)
    tk.Button(window, text='Mostrar contraseña en esta pantalla',
              command=lambda: value.set(password())).pack(pady=10)
    window.mainloop()
