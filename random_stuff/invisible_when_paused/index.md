---
layout: page
---

<canvas width="1024" height="512" id="shader_canvas"></canvas>

<button id="pause_button" onclick="pause()">Pause</button>

Load a file (image or video): <input id="image_src" type="file" onchange="switch_image()">, or <button id="reset" onclick="load_image('./text.png')">reload the default image</button>.

<script src="./shader.js"></script>