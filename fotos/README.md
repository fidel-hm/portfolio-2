# Hier kommen deine Originale rein

Einfach ablegen — Größe und Dateiname sind egal, Hoch- und Querformat
gemischt ist kein Problem. JPG, PNG, HEIC und TIFF gehen alle.

```
fotos/
├── irgendein-name.jpg     ← normale Bilder, direkt hier rein
└── panorama/              ← Panoramen NUR hier rein
    └── weites-tal.jpg
```

**Panoramen gehören in den Unterordner `panorama/`.** Die werden anders
verarbeitet: sie wandern nicht als ganzes Bild in eine Spalte, sondern
werden mittig halbiert — linke Hälfte in die linke Spalte, rechte in die
rechte. Beim Scrollen laufen die beiden Hälften dann aufeinander zu und
schnappen in der Bildschirmmitte zum vollständigen Panorama zusammen.

Die Bilder in `fotos/` sind die **Originale** und landen nicht auf der
Website. Aus ihnen entstehen die fertigen Web-Versionen in `images/`:
verkleinert, komprimiert, Panoramen halbiert, Seitenverhältnis korrekt
im HTML eingetragen.

Reihenfolge, Aufteilung auf die Spalten oder besondere Wünsche
("das Hochformat soll ganz am Anfang stehen") einfach dazusagen —
sonst verteile ich sie sinnvoll abwechselnd auf beide Spalten.
