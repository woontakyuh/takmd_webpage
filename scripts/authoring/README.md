# Local asset viewer

From the repository root, run `python3 -m http.server 4323 --bind 127.0.0.1`, then open [the local viewer](http://127.0.0.1:4323/scripts/authoring/asset-viewer.html).

This development tool loads Google's model-viewer module and reads models directly from `public/models`. Keep it outside `public/`: the production build check rejects its path, marker, element, and external loader if it is copied into a published build.
