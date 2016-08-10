chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('SDX.html', {
    'bounds': {
      'width': 1284,
      'height': 649
    }
  });
});

// starting the engine
(function() {
	new SDX();
})();