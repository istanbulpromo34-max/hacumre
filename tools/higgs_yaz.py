#!/usr/bin/env python3
"""Higgsfield sonuç adreslerini gelen/higgs.json kuyruğuna yazar.

Kullanım:
  echo '[{"id":"arac-kokusu","url":"https://..."}]' | python3 tools/higgs_yaz.py

Depoyu klonlamaya gerek yoktur; yazma GitHub Contents API ile yapılır.
Kuyrukta zaten kayıt varsa üstüne eklenir, aynı id tekrar yazılmaz.
Dosyaya yazıldığı anda higgs.yml iş akışı tetiklenir ve gerisi otomatik işler.
"""
import base64
import json
import os
import subprocess
import sys

DEPO = os.environ.get("DEPO", "istanbulpromo34-max/hacumre")
DAL = os.environ.get("DAL", "main")
YOL = "gelen/higgs.json"


def api(args, govde=None):
    c = subprocess.run(["gh", "api"] + args, input=govde, capture_output=True, text=True, timeout=90)
    return c.returncode, c.stdout, c.stderr


def main():
    try:
        yeni = json.loads(sys.stdin.read() or "[]")
    except json.JSONDecodeError as e:
        sys.exit(f"Girdi JSON değil: {e}")
    yeni = [x for x in yeni if isinstance(x, dict) and x.get("id") and x.get("url")]
    if not yeni:
        print("Yazılacak kayıt yok.")
        return

    sha, mevcut = None, []
    kod, cikti, _ = api([f"repos/{DEPO}/contents/{YOL}?ref={DAL}"])
    if kod == 0:
        try:
            d = json.loads(cikti)
            sha = d.get("sha")
            mevcut = json.loads(base64.b64decode(d.get("content", "")) or b"[]")
        except Exception:
            sha, mevcut = sha, []

    varolan = {x.get("id") for x in mevcut if isinstance(x, dict)}
    birlesik = mevcut + [x for x in yeni if x["id"] not in varolan]

    govde = {
        "message": f"Higgsfield kuyrugu: {len(birlesik)} kare",
        "content": base64.b64encode(json.dumps(birlesik, ensure_ascii=False).encode()).decode(),
        "branch": DAL,
    }
    if sha:
        govde["sha"] = sha

    kod, cikti, hata = api(["-X", "PUT", f"repos/{DEPO}/contents/{YOL}", "--input", "-"],
                           govde=json.dumps(govde))
    if kod != 0:
        sys.exit(f"Yazılamadı: {hata.strip()[:300]}")
    print(f"Kuyruğa yazıldı: {len(birlesik)} kare ({len(birlesik) - len(mevcut)} yeni). "
          "higgs.yml iş akışı kendiliğinden çalışacak.")


if __name__ == "__main__":
    main()
