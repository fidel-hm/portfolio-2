# Fidelis Müller — Portfolio

Statische Seite, kein Build-Step. Läuft direkt auf GitHub Pages.

## Lokal ansehen

```bash
python3 -m http.server 8765
# http://localhost:8765
```

## Eigene Fotos einsetzen

1. Bilder nach `images/` legen (Hochformat, ca. 1600×2000 px, JPG, ~300 KB pro Bild).
2. In `index.html` die `src`-Pfade ersetzen. Wichtig ist nur die Reihenfolge:
   - **Linke Spalte** ist von unten nach oben gelesen — das Bild direkt über
     dem Titelblock ist das erste, das man beim Scrollen sieht.
   - **Rechte Spalte** ist normal von oben nach unten gelesen.
3. `alt`-Texte ergänzen.

Mehr oder weniger Bilder sind kein Problem — die Scrollhöhe misst sich selbst.
Am besten beide Spalten gleich lang halten.

## Justierschrauben

In `css/style.css` unter `:root`:

| Variable | Wirkung |
|---|---|
| `--img-h` | Höhe einer Bildkachel |
| `--peek-ratio` | Wie viel vom ersten Bild im Startzustand hereinragt (0.6667 = 2/3) |
| `--gap` | Abstand zwischen den Kacheln |
| `--gutter` | Außenrand und Spaltenabstand |

In `js/main.js` oben:

| Konstante | Wirkung |
|---|---|
| `EASE` | Trägheit des Scrollens — kleiner = weicher/schwerer |
| `SKEW_MAX` | Wie stark die Spalten bei Tempo kippen |
| `SCALE_MAX` | Wie stark die Motive bei Tempo gestreckt werden |
| `PARALLAX` | Eigenbewegung des Motivs im Rahmen |
