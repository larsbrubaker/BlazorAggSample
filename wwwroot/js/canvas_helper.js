window.updateCanvas = function (canvas, width, height, pixelData) {
    // Use previously stored context if available, otherwise get and store it
    if (!canvas.context) {
        canvas.context = canvas.getContext('2d');
    }
    var context = canvas.context;

    // Check if size has changed or if imageData is not yet created
    if (!canvas.imageData || canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.imageData = context.createImageData(width, height);
    }

    var data = new Uint32Array(canvas.imageData.data.buffer);

    // Create a Uint32Array view of the pixel data
    var uint32View = new Uint32Array(pixelData.buffer);

    // Flip the data top to bottom
    for (var y = 0; y < height; y++) {
        var rowStart = y * width;
        var flippedRowStart = (height - y - 1) * width;

        for (var x = 0; x < width; x++) {
            var i = rowStart + x;
            var j = flippedRowStart + x;
            data[j] = uint32View[i];
        }
    }

    context.putImageData(canvas.imageData, 0, 0);
};
