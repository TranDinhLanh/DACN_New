import requests, sys, os

url='http://127.0.0.1:8000/api/v1/ocr/upload'
uploads_dir = 'static/uploads'
imgs = [f for f in os.listdir(uploads_dir) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))]
if not imgs:
    print('NO_IMAGE_FILES_FOUND')
    sys.exit(1)

import mimetypes

for fname in imgs:
    fpath = os.path.join(uploads_dir, fname)
    mime, _ = mimetypes.guess_type(fpath)
    if not mime:
        mime = 'image/jpeg'
    try:
        with open(fpath, 'rb') as fh:
            files = {'file': (fname, fh, mime)}
            r = requests.post(url, files=files)
        print('TRY', fname, mime)
        print(r.status_code)
        print(r.text)
        if r.status_code == 200:
            break
    except Exception as e:
        print('ERROR with', fname, e, file=sys.stderr)
