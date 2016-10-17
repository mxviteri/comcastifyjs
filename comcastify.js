var comcastifyjs = (function () {

  // setup slowload modifier callback, structure avoids some annoying timer/closure problems
  var slowloadModiferCallback = function (slowloadDiv, args) {
    return function () {
      (function (slowloadDiv, args) {
        // calculate new height for box based on args
        var img = slowloadDiv.slothifyData.img;
        var newTopClip = slowloadDiv.slothifyData.imageTopClip + args.loadIncrement;
        var progressiveJPEGInProgress = false;
        if (args.randomPause === 0.0 || Math.random() > args.randomPause) {
          slowloadDiv.style.width = img.offsetWidth + 'px';
          slowloadDiv.style.height = img.offsetHeight + 'px';
          slowloadDiv.style.top = img.offsetTop + 'px';
          slowloadDiv.style.left = img.offsetLeft + 'px';

          // update slowload div
          slowloadDiv.style.clip = slowloadDiv.horizontalOrientation ? 'rect(auto auto auto ' + newTopClip + 'px)' : 'rect(' + newTopClip + 'px auto auto auto)';
        }

        // check stopping conditions
        var maxImage = slowloadDiv.horizontalOrientation ? img.width * args.loadMaxPercent : img.height * args.loadMaxPercent;

        //process progressive JPEG unblurring
        if (args.progressiveJPEG && newTopClip >= maxImage) {
          var newTopClipBlur = slowloadDiv.slothifyData.blurImageTopClip + args.loadIncrement;

          //continue to honor the randomPause setting
          if (args.randomPause === 0.0 || Math.random() > args.randomPause) {
            slowloadDiv.slothifyData.blurImg.style.width = img.offsetWidth + 'px';
            slowloadDiv.slothifyData.blurImg.style.height = img.offsetHeight + 'px';
            slowloadDiv.slothifyData.blurImg.style.top = img.offsetTop + 'px';
            slowloadDiv.slothifyData.blurImg.style.left = img.offsetLeft + 'px';

            // update slowload div
            slowloadDiv.slothifyData.blurImg.style.clip = slowloadDiv.horizontalOrientation ? 'rect(auto auto auto ' + newTopClipBlur + 'px)' : 'rect(' + newTopClipBlur + 'px auto auto auto)';

            slowloadDiv.slothifyData.blurImageTopClip = newTopClipBlur;
          }

          // check stopping conditions
          var maxImageBlur = slowloadDiv.horizontalOrientation ? img.width * args.loadMaxPercent : img.height * args.loadMaxPercent;

          if (newTopClipBlur < maxImageBlur) {
            progressiveJPEGInProgress = true;
          }
        }

        if (!img.complete) {
          setTimeout(slowloadModiferCallback(slowloadDiv, args), args.loadSpeed);
        } else if (typeof img.naturalHeight !== "undefined" && img.naturalWidth === 0) {
          setTimeout(slowloadModiferCallback(slowloadDiv, args), args.loadSpeed);
        } else if (!maxImage || maxImage === 0 || newTopClip < maxImage || progressiveJPEGInProgress) {
          // create new update timeout
          slowloadDiv.slothifyData.imageTopClip = newTopClip;
          setTimeout(slowloadModiferCallback(slowloadDiv, args), args.loadSpeed);
        }
      })(slowloadDiv, args);
    };
  };

  var prepare = function () {
    // hide images so image doesn't show up before box
    var imgs = document.getElementsByTagName('img');
    for(var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      img.style.visibility = 'hidden';
    }
  };

  var slowImages = function (args) {
    return function () {

      var params = {
        // elements affected
        elements: args.elements || document.querySelectorAll('img:not([class="progressiveJPEGemulator"])'),
        boxColor: args.boxColor || '#000000',                             // color of box overlay
        loadMaxPercent: args.loadMaxPercent || 0.0,                       // max percentage to load images
        loadSpeed: args.loadSpeed || 500,                                 // how often in ms to pass
        randLoadIncrement: args.randLoadIncrement || false,               // true to randomize load increment
        loadIncrement: args.loadIncrement || 1,                           // pixels to load per pass
        randomPause: args.randomPause || 0.0,                             // probability of skipping a pass
        progressiveJPEG: args.progressiveJPEG || false,        			  // enable progressive JPEG emulation
		horizontalOrientation: args.horizontalOrientation || false		  // vertical or horizontal loading
      };

      // make 'em load slow
      for(var i = 0; i < params.elements.length; i++) {
        // get some things we need
        var img = params.elements[i],
            parent = img.parentNode,
            slowload = document.createElement('DIV');

        // set up initial state of box
        slowload.style.backgroundColor = params.boxColor;
        slowload.style.width = img.offsetWidth + 'px';
        slowload.style.height = img.offsetHeight + 'px';
        slowload.style.position = 'absolute';
        slowload.style.top = img.offsetTop + 'px';
        slowload.style.left = img.offsetLeft + 'px';
        slowload.style.clip = params.horizontalOrientation ? 'rect(auto auto auto 0)' : 'rect(0 auto auto auto)';

        // remember what the max height/width should be for later calculation
        slowload.slothifyData = {
            img: img,
            imageTopClip: 0,
            maxImage: params.horizontalOrientation ? img.height * params.loadMaxPercent : img.width * params.loadMaxPercent
        };
		
		// remember the set or default load orientation
		slowload.horizontalOrientation = params.horizontalOrientation;

        // setup the blurred image for progressive JPEG if needed
        if (params.progressiveJPEG === true) {
          var progressiveJPEGdiv = document.createElement('DIV');
          progressiveJPEGdiv.style.backgroundColor = params.boxColor;
          progressiveJPEGdiv.style.width = img.offsetWidth + 'px';
          progressiveJPEGdiv.style.height = img.offsetHeight + 'px';
          progressiveJPEGdiv.style.position = 'absolute';
          progressiveJPEGdiv.style.top = img.offsetTop + 'px';
          progressiveJPEGdiv.style.left = img.offsetLeft + 'px';
          progressiveJPEGdiv.style.clip = params.horizontalOrientation ? 'rect(auto auto auto 0)' : 'rect(0 auto auto auto)';
          progressiveJPEGdiv.style.overflow = 'hidden';

          var progressiveJPEGimg = document.createElement('IMG');
          progressiveJPEGimg.setAttribute('class','progressiveJPEGemulator');
          progressiveJPEGimg.setAttribute('src',img.src);
          progressiveJPEGimg.setAttribute('style','margin: -2px 0 0 0; -webkit-filter: blur(5px); -moz-filter: blur(5px); -o-filter: blur(5px); -ms-filter: blur(5px); filter: blur(5px);');
          progressiveJPEGimg.setAttribute('width', progressiveJPEGdiv.style.width);
          progressiveJPEGimg.setAttribute('height', progressiveJPEGdiv.style.height);
          progressiveJPEGdiv.appendChild(progressiveJPEGimg);
          parent.appendChild(progressiveJPEGdiv);

          slowload.slothifyData.blurImg = progressiveJPEGdiv;
          slowload.slothifyData.blurImageTopClip = 0;
        }

        // put box over image
        parent.appendChild(slowload);

        // show image again
        img.style.visibility = 'visible';

        if (params.loadMaxPercent > 0.0) {

          // allow for some changing of params per image
          var modParamPerImg = Object.create(params);
          if(modParamPerImg.randLoadIncrement) {
            // randomize load increment
            modParamPerImg.loadIncrement = Math.floor((Math.random() * 20) + 1);
          }

          // slowload using timeout since this is nicer to the browser :)
          setTimeout(slowloadModiferCallback(slowload, modParamPerImg), params.loadSpeed);
        }
      }
    };
  };

  return {
    letsPrepareTheseImages: prepare,
    fixMyImagesLoadingSoFast: slowImages
  };

})();
