# Start here (about 5 minutes, one time)

There is **one script**: `dist/embroidery.js`. Everything else happens inside it, in plain-language dialogs.

## 1. Turn scripting on in Affinity (once)
1. Open **Settings** (Mac: *Affinity > Settings*, Windows: *Edit > Settings*) and choose **Scripting**.
2. Tick **Enable Affinity Scripting**.
3. Under *Default Permissions*, tick **Access the file system**.
4. Under *File System access*, click **Add** and choose the folder where you want your embroidery files saved (your **Desktop** is fine).

If you skip this, the script tells you exactly what to switch on.

## 2. Add the script (once)
Pick one:
- **Script Manager app:** drag `dist/embroidery.js` onto it and choose *Save & install*. (It needs a category in Affinity's Scripts panel first: *Window > Scripting > Scripts Library*, panel menu, *New Category*.)
- **Straight into Affinity:** *Window > Scripting > Script Editor*, *New Script*, paste the whole contents of `dist/embroidery.js`, open the script's **Settings** (cog) and tick *Access the file system*, then **Save As** so it appears in the Scripts Library.

## 3. Use it
1. Draw (or open) some shapes. **Select the ones you want**, or select nothing to use the whole page.
2. Click **Embroidery** in the Scripts Library. A small menu asks what you'd like to do:

| Menu choice | What happens |
|---|---|
| **Make an embroidery file** | Pick your machine type, a file name and (optionally) your hoop. The file is saved in your allowed folder and you get a summary: stitches, colours, size, whether it fits. Tick *Show more options* for trims, lock stitches, minimum stitch length and thread brand matching. |
| **Preview the stitches on the page** | Draws the stitches as thin coloured lines on a layer called "Embroidery preview". |
| **Remove the preview** | Deletes that layer. |
| **Change stitch settings** | Everything editable: stitch type, **density** (preset or exact row spacing), stitch lengths, angle, stagger, underlay, satin width/pull compensation, short stitches, thread colour override. Apply to the selected shapes, or to every shape as the new default. |
| **Save a thread list** | A text file listing the threads in sewing order. |
| **Send a diagnostic report** | Only if something looks wrong: writes `embroidery-diagnostics.txt` so it can be fixed. |

## What the defaults do
Filled shapes get a fill stitch (with underlay), thin outlines (under 1.5 mm) get a running stitch, thick outlines get a satin column. Change any of that under **Change stitch settings**.

## If something goes wrong
- Run the script and choose **Send a diagnostic report**, then share `embroidery-diagnostics.txt` (it is saved in the folder you allowed; it also shows on screen).
- *Window > Scripting > Log Console* shows any error messages.
