#!/usr/bin/env python3
"""Higgsfield sonuç adreslerini gelen/higgs.json kuyruğuna yazar.

Kullanım (deponun içinden ya da herhangi bir yerden):
  echo '[{"id":"arac-kokusu","url":"https://..."}]' | python3 -I tools/higgs_yaz.py

Depo yoksa geçici bir dizine sığ olarak klonlar. Yazma git ile yapılır;
GitHub Contents API'ye yazma bu ortamda kapalıdır.

Kuyrukta zaten kayıt varsa üstüne eklenir, aynı id tekrar yazılmaz.
Dosya depoya düşer düşmez higgs.yml iş akışı tetiklenir, gerisi otomatiktir.
"""
import json
import os
import random
import subprocess
import sys
import tempfile
import time
from pathlib import Path

DEPO = os.environ.get("DEPO", "istanbulpromo34-max/hacumre")
DAL = os.environ.get("DAL", "main")
YOL = "gelen/higgs.json"


def ko(args, cwd, **k):
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=180, **k)


def depo_bul():
    """Çalışılan yer depo mu? Değilse sığ klon al."""
    c = ko(["git", "rev-parse", "--show-toplevel"], cwd=".")
    if c.returncode == 0:
        kok = Path(c.stdout.strip())
        u = ko(["git", "remote", "get-url", "origin"], cwd=kok)
        if DEPO in (u.stdout or ""):
            ko(["git", "fetch", "--quiet", "origin", DAL], cwd=kok)
            ko(["git", "reset", "--quiet", "--hard", f"origin/{DAL}"], cwd=kok)
            return kok, False
    gecici = Path(tempfile.mkdtemp(prefix="hacumre-"))
    c = ko(["git", "clone", "--quiet", "--depth", "1", "--branch", DAL,
            f"https://github.com/{DEPO}", str(gecici / "depo")], cwd=".")
    if c.returncode != 0:
        sys.exit(f"Depo klonlanamadı: {c.stderr.strip()[:300]}")
    return gecici / "depo", True


def main():
    try:
        yeni = json.loads(sys.stdin.read() or "[]")
    except json.JSONDecodeError as e:
        sys.exit(f"Girdi JSON değil: {e}")
    yeni = [x for x in yeni if isinstance(x, dict) and x.get("id") and x.get("url")]
    if not yeni:
        print("Yazılacak kayıt yok.")
        return

    kok, _ = depo_bul()
    dosya = kok / YOL
    dosya.parent.mkdir(parents=True, exist_ok=True)

    for deneme in range(1, 6):
        mevcut = []
        if dosya.exists():
            try:
                mevcut = json.loads(dosya.read_text(encoding="utf-8") or "[]")
            except json.JSONDecodeError:
                mevcut = []
        varolan = {x.get("id") for x in mevcut if isinstance(x, dict)}
        birlesik = mevcut + [x for x in yeni if x["id"] not in varolan]
        dosya.write_text(json.dumps(birlesik, ensure_ascii=False), encoding="utf-8")

        ko(["git", "config", "user.name", "foto-bot"], cwd=kok)
        ko(["git", "config", "user.email", "foto-bot@users.noreply.github.com"], cwd=kok)
        ko(["git", "add", YOL], cwd=kok)
        if not ko(["git", "status", "--porcelain", YOL], cwd=kok).stdout.strip():
            print("Kuyrukta değişiklik yok, hepsi zaten sırada.")
            return
        ko(["git", "commit", "--quiet", "-m", f"Higgsfield kuyrugu: {len(birlesik)} kare"], cwd=kok)
        if ko(["git", "push", "--quiet", "origin", f"HEAD:{DAL}"], cwd=kok).returncode == 0:
            print(f"Kuyruğa yazıldı: {len(birlesik)} kare "
                  f"({len(birlesik) - len(mevcut)} yeni). higgs.yml kendiliğinden çalışacak.")
            return
        ko(["git", "fetch", "--quiet", "origin", DAL], cwd=kok)
        ko(["git", "rebase", "--quiet", "-X", "theirs", f"origin/{DAL}"], cwd=kok)
        time.sleep(random.uniform(2, 6))
        print(f"  yazma çakıştı, yeniden deneniyor ({deneme}/5)", file=sys.stderr)

    sys.exit("Kuyruğa yazılamadı.")


if __name__ == "__main__":
    main()
