# Fidelis Müller — Portfolio

Statische Seite, kein Build-Step. Läuft direkt auf GitHub Pages.
Live: https://fidel-hm.github.io/portfolio-2/

## Lokal ansehen

```bash
python3 -m http.server 8765
# http://localhost:8765
```

## Eigene Fotos einsetzen

Bilder nach `images/` legen (JPG, ~300 KB pro Bild) und in `index.html`
die `src`-Pfade ersetzen. Jede Kachel braucht ihr Seitenverhältnis als
`--ar` (**Breite geteilt durch Höhe**):

```html
<figure class="frame" style="--ar: 1.5">    <!-- quer, 3:2 -->
<figure class="frame" style="--ar: 0.6667"> <!-- hoch,  2:3 -->
```

Alle Kacheln sind gleich breit, die Höhe ergibt sich aus `--ar`. Hoch- und
Querformate lassen sich also frei mischen.

Zur Reihenfolge: die **linke Spalte wird von unten nach oben gelesen** —
das Bild direkt über dem Titelblock ist das erste, das man beim Scrollen
sieht. Die **rechte Spalte** liest sich normal von oben nach unten. Die
Scrollhöhe misst sich selbst, die Anzahl der Bilder ist also frei.

### Panorama-Bilder

Ein Panorama wird in zwei Hälften geteilt — linke Hälfte in die linke
Spalte, rechte in die rechte. Beim Scrollen laufen sie aufeinander zu,
ziehen sich in der Bildschirmmitte magnetisch zusammen und zeigen kurz
das ununterbrochene Bild, bevor sie zäh wieder auseinandergehen.

```html
<!-- linke Spalte -->
<figure class="frame frame--pano" style="--ar: 1.5"
        data-pano="a" data-pano-side="left">
  <img src="images/pano-a-left.svg" alt="">
</figure>

<!-- rechte Spalte -->
<figure class="frame frame--pano" style="--ar: 1.5"
        data-pano="a" data-pano-side="right">
  <img src="images/pano-a-right.svg" alt="">
</figure>
```

Wichtig dabei:

- Beide Hälften brauchen dasselbe `data-pano` (hier `"a"`). Mehrere
  Panoramen bekommen einfach andere Schlüssel: `"b"`, `"c"`, …
- Beide Hälften exakt gleich groß schneiden, und `--ar` muss dem
  Seitenverhältnis **der Hälfte** entsprechen (ein 3:1-Panorama ergibt
  zwei Hälften mit je `--ar: 1.5`). Stimmt das nicht, beschneidet der
  Rahmen das Bild und die Naht passt nicht mehr.
- Wo die Hälften im Stack stehen, ist egal — JavaScript richtet die
  Spalten beim Laden automatisch so aus, dass beide Hälften bei genau
  demselben Scrollfortschritt in der Mitte ankommen.

## Justierschrauben

In `css/style.css` unter `:root`:

| Variable | Wirkung |
|---|---|
| `--col-w` | Spaltenbreite. Der `58vh`-Teil deckelt sie so, dass auch 2:3-Hochformate ganz auf den Schirm passen — bei steileren Formaten senken. |
| `--split` | Lücke zwischen den Spalten (= Weg, den die Panorama-Hälften zurücklegen) |
| `--gap` | Abstand zwischen den Kacheln |
| `--peek-ratio` | Wie viel vom ersten Bild im Startzustand hereinragt (0.6667 = 2/3) |

In `js/main.js` oben:

| Konstante | Wirkung |
|---|---|
| `EASE` | Trägheit des Scrollens — kleiner = weicher/schwerer |
| `SKEW_MAX` | Wie stark die Spalten bei Tempo kippen |
| `SCALE_MAX` | Wie stark die Motive bei Tempo gestreckt werden |
| `PARALLAX` | Eigenbewegung des Motivs im Rahmen |
| `SNAP_RANGE` | Ab welcher Entfernung das Panorama zu ziehen beginnt |
| `SNAP_PULL` | Wie stark der Magnet zieht |
| `SNAP_DRAG` | Wie zäh das Weiterscrollen am Panorama wird |
