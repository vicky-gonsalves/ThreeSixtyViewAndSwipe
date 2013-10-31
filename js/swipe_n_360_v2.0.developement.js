/*!
 * Swipe_and_Three_Sixty_v2.0.0 ~ Copyright (c) 2012 Vicky Gonsalves
 * Contact +91-9766222843,8097598395
 */

(function () {
    var m = Math,
        mround = function (r) {
            return r >> 0;
        },
        vendor = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
            (/firefox/i).test(navigator.userAgent) ? 'Moz' :
                (/trident/i).test(navigator.userAgent) ? 'ms' :
                    'opera' in window ? 'O' : '',

        // Browser capabilities
        isAndroid = (/android/gi).test(navigator.appVersion),
        isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
        isPlaybook = (/playbook/gi).test(navigator.appVersion),
        isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),

        has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
        hasTouch = 'ontouchstart' in window && !isTouchPad,
        hasTransform = vendor + 'Transform' in document.documentElement.style,
        hasTransitionEnd = isIDevice || isPlaybook,

        // Events
        RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
        START_EV = hasTouch ? 'touchstart' : 'mousedown',
        MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
        END_EV = hasTouch ? 'touchend' : 'mouseup',
        CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
        WHEEL_EV = vendor == 'Moz' ? 'DOMMouseScroll' : 'mousewheel',


        // Constructor
        threeSixty = function (el, options) {
            var that = this,
                doc = document,
                i;
            that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
            that.wrapper.style.overflow = 'hidden';
            that.scroller = that.wrapper;


            // Default options
            that.options = {
                imagePath:null,
                imagePosX:0,
                imagePosY:0,
                imageWidth:0,
                imageHeight:0,
                behavior:"360",
                transitionDuration:100,
                infinite:true,
                sensitivity:25,
                direction:"horizontal",
                frameWidth:0,
                frameHeight:0,
                totalFrames:null,
                momentum:true,
                slideShow:false,
                slideShowDelay:2000, //milliseconds
                slideShowDirection:"RTL",
                slideShowWithTransition:true,
                currentFrame:1
            }

            // User defined options
            for (i in options) that.options[i] = options[i];

            that.repeat = '';

            if (that.options.infinite == false) {
                that.repeat = 'no-repeat';
            }

            // Set some default styles
            that.scroller.style[vendor + 'TransitionDuration'] = '0';
            if (that.options.direction == 'horizontal') {
                that.scroller.style.cssText += 'background:url(' + that.options.imagePath + ') ' + that.repeat + ';width:' + that.options.frameWidth + 'px;height:' + that.options.frameHeight + 'px;cursor:e-resize;';
            } else if (that.options.direction == 'vertical') {
                that.scroller.style.cssText += 'background:url(' + that.options.imagePath + ') ' + that.repeat + ';width:' + that.options.frameWidth + 'px;height:' + that.options.frameHeight + 'px;cursor:n-resize;';
            }

            that._bind(RESIZE_EV, window);
            that._bind(START_EV);
            if (!hasTouch) {
                that._bind('mouseout', that.wrapper);
            }

//            if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
//                that._checkDOMChanges();
//            }, 500);

            //set Current Frame
            if (that.options.currentFrame != 1) {
                if (that.options.direction == 'horizontal') {
                    that.options.imageWidth -= (that.options.frameWidth * (that.options.currentFrame - 1));
                } else if (that.options.direction == 'vertical') {
                    that.options.imageHeight -= (that.options.frameHeight * (that.options.currentFrame - 1));
                }
                that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
                that.options.imagePosX = that.options.imageWidth;
                that.options.imagePosY = that.options.imageHeight;
            }
            if (that.options.slideShow) {
                that.startSlideShow();
            }
//

        };

// Prototype
    threeSixty.prototype = {
        enabled:true,
        x:0,
        y:0,
        steps:[],
        scale:1,
        currPageX:0,
        currPageY:0,
        pagesX:[],
        pagesY:[],
        aniTime:null,
        wheelZoomCount:0,
        ctFrame:0,
        panStarted:null,
        panStopped:null,

        handleEvent:function (e) {
            var that = this;
            switch (e.type) {
                case START_EV:
                    if (!hasTouch && e.button !== 0) return;
                    that._start(e);
                    break;
                case MOVE_EV:
                    that._move(e);
                    break;
                case END_EV:
                    that._animate(e);
                    that._end(e);
                    break;
                case CANCEL_EV:
                    that._animate(e);
                    that._end(e);
                    break;
//                case RESIZE_EV:
//                    that._resize();
//                    break;
//                case WHEEL_EV:
//                    that._wheel(e);
//                    break;
                case 'mouseout':
                    that._mouseout(e);
                    break;
                case 'webkitTransitionEnd':
                    that._transitionEnd(e);
                    break;
            }
        },

        _bind:function (type, el, bubble) {
            (el || this.scroller).addEventListener(type, this, !!bubble);
        },

        _unbind:function (type, el, bubble) {
            (el || this.scroller).removeEventListener(type, this, !!bubble);
        },

        _start:function (e) {
            var that = this,
                doc = document,
                point = hasTouch ? e.touches[0] : e;

            that.panStarted = true;
            that.panStopped = false;

            if (that.panStarted == true) {
                that.onPanStarted();
            }
            that._flicked = false;
            that._flickLTR = false;
            that._flickRTL = false;
            that._animated = false;
            that.pos = that.scroller.style.backgroundPosition;
            that.pointX = point.pageX;
            that.pointY = point.pageY;
            that.pointXOrig = point.pageX;
            that.pointYOrig = point.pageY;
            that.startTime = e.timeStamp || Date.now();

            that._bind(MOVE_EV);
            that._bind(END_EV);
            that._bind(CANCEL_EV);
            console.log('Inside Start');
        },

        _move:function (e) {
            var that = this,
                doc = document,
                point = hasTouch ? e.touches[0] : e,
                deltaX = that.pointX - point.pageX  ,
                deltaX2 = point.pageX - that.pointX  ,
                deltaY = that.pointY - point.pageY,
                deltaY2 = point.pageY - that.pointY,
                timestamp = e.timeStamp || Date.now();


            if (that.options.behavior == "360") {
                time = 0;
                time += 'ms';
                this.scroller.style[vendor + 'TransitionDuration'] = time;

                if (that.options.direction == 'horizontal') {
                    console.log('Inside Horizontal MOVE');
                    if (that.pointX > point.pageX && deltaX > that.options.sensitivity) {
                        e.preventDefault();
                        that.options.imageWidth -= that.options.frameWidth;
                        that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
                        that.pointX = point.pageX;
                        that.pointY = point.pageY;
                        that._increaseFrameCount();
                    }
                    if (that.pointX < point.pageX && deltaX2 > that.options.sensitivity) {
                        e.preventDefault();
                        that.options.imageWidth += that.options.frameWidth;
                        that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
                        that.pointX = point.pageX;
                        that.pointY = point.pageY;
                        that._decreaseFrameCount();
                    }
                } else if (that.options.direction == 'vertical') {
                    console.log('Inside Vertical MOVE');
                    if (that.pointY > point.pageY && deltaY > that.options.sensitivity) {
                        e.preventDefault();
                        that.options.imageHeight -= that.options.frameHeight;
                        that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
                        that.pointX = point.pageX;
                        that.pointY = point.pageY;
                        that._increaseFrameCount();
                    }
                    if (that.pointY < point.pageY && deltaY2 > that.options.sensitivity) {
                        e.preventDefault();
                        that.options.imageHeight += that.options.frameHeight;
                        that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
                        that.pointX = point.pageX;
                        that.pointY = point.pageY;
                        that._decreaseFrameCount();
                    }
                }
            }
            else if (that.options.behavior == "swipe") {

                if (timestamp - that.startTime > 100) {
                    time = 0;
                    time += 'ms';
                    this.scroller.style[vendor + 'TransitionDuration'] = time;
                    if (that.options.direction == 'horizontal') {
//RTL
                        if (that.pointX > point.pageX && deltaX > that.options.sensitivity) {
                            e.preventDefault();
                            if (that.options.infinite || that.options.currentFrame < that.options.totalFrames || that.options.momentum) {
                                if (that.options.currentFrame == that.options.totalFrames) {
                                    that.options.imagePosX += deltaX2 / 3;
                                } else {
                                    that.options.imagePosX += deltaX2;
                                }
                                that.scroller.style.backgroundPosition = that.options.imagePosX + 'px ' + 0 + 'px';
                                that.pointX = point.pageX;
                                that.pointY = point.pageY;
                                //document.getElementById('debug').innerHTML = that.pointX;
                            }
                        }
//LTR
                        if (that.pointX < point.pageX && deltaX2 > that.options.sensitivity) {
                            e.preventDefault();
                            if (that.options.infinite || that.options.currentFrame > 1 || that.options.momentum) {
                                if (that.options.currentFrame == 1) {
                                    that.options.imagePosX -= deltaX / 3;
                                } else {
                                    that.options.imagePosX -= deltaX;
                                }
                                that.scroller.style.backgroundPosition = that.options.imagePosX + 'px ' + 0 + 'px';
                                that.pointX = point.pageX;
                                that.pointY = point.pageY;
                                //document.getElementById('debug').innerHTML = that.pointX;
                            }
                        }
                    } else if (that.options.direction == 'vertical') {
                        if (that.pointY > point.pageY && deltaY > that.options.sensitivity) {
                            e.preventDefault();
                            if (that.options.infinite || that.options.currentFrame < that.options.totalFrames || that.options.momentum) {

                                if (that.options.currentFrame == that.options.totalFrames) {
                                    that.options.imagePosY += deltaY2 / 3;
                                } else {
                                    that.options.imagePosY += deltaY2;
                                }

                                that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imagePosY + 'px';
                                that.pointX = point.pageX;
                                that.pointY = point.pageY;
                                //document.getElementById('debug').innerHTML = that.pointX;
                            }
                        }
                        if (that.pointY < point.pageY && deltaY2 > that.options.sensitivity) {
                            e.preventDefault();
                            if (that.options.infinite || that.options.currentFrame > 1 || that.options.momentum) {
                                if (that.options.currentFrame == 1) {
                                    that.options.imagePosX -= deltaY / 3;
                                } else {
                                    that.options.imagePosX -= deltaY;
                                }

                                that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imagePosY + 'px';
                                that.pointX = point.pageX;
                                that.pointY = point.pageY;
                                //document.getElementById('debug').innerHTML = that.pointX;
                            }
                        }
                    }
                } else {
                    time = 0;
                    time += 'ms';
                    that._flicked = true;
                    that._slideImages = Math.round((timestamp - that.startTime));
                    this.scroller.style[vendor + 'TransitionDuration'] = time;

                    if (that.options.direction == 'horizontal') {
                        if (that.pointX > point.pageX && deltaX > that.options.sensitivity) {
                            e.preventDefault();
                            that._flickRTL = true;
                            that.scroller.style.backgroundPosition = that.options.imagePosX + 'px ' + 0 + 'px';
                            that.pointX = point.pageX;
                            that.pointY = point.pageY;
                            //document.getElementById('debug').innerHTML = that.pointX;
                        }
                        if (that.pointX < point.pageX && deltaX2 > that.options.sensitivity) {
                            e.preventDefault();
                            that._flickLTR = true;
                            that.scroller.style.backgroundPosition = that.options.imagePosX + 'px ' + 0 + 'px';
                            that.pointX = point.pageX;
                            that.pointY = point.pageY;
                            //document.getElementById('debug').innerHTML = that.pointX;
                        }
                    } else if (that.options.direction == 'vertical') {
                        if (that.pointY > point.pageY && deltaY > that.options.sensitivity) {
                            e.preventDefault();
                            that._flickRTL = true;
                            that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imagePosY + 'px';
                            that.pointX = point.pageX;
                            that.pointY = point.pageY;
                            //document.getElementById('debug').innerHTML = that.pointX;
                        }
                        if (that.pointY < point.pageY && deltaY2 > that.options.sensitivity) {
                            e.preventDefault();
                            that._flickLTR = true;
                            that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imagePosY + 'px';
                            that.pointX = point.pageX;
                            that.pointY = point.pageY;
                            //document.getElementById('debug').innerHTML = that.pointX;
                        }
                    }
                }
            }
        },
        _animate:function (e) {
            if (this.options.behavior == "swipe") {
                var that = this,
                    doc = document,
                    point = hasTouch ? e.touches[0] : e;
                time = that.options.transitionDuration;
                time += 'ms';
                this.scroller.style[vendor + 'TransitionDuration'] = time;
//Horizontal
                if (that.options.direction == 'horizontal') {

//if swiped > 50%  Direction:LTR
                    if (((that.pointX - that.pointXOrig) > (that.options.frameWidth / 2)) && that._flicked == false) {
                        if (that.options.infinite || (!(that.options.infinite) && (that.options.currentFrame > 1))) {
                            that.options.imageWidth += that.options.frameWidth;
                            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                            that.options.imagePosX = that.options.imageWidth;
                            that._decreaseFrameCount();
                        }
                    }
//if swiped > 50%  Direction:RTL
                    else if ((that.pointXOrig - that.pointX) > (that.options.frameWidth / 2) && that._flicked == false) {
                        if (that.options.infinite || (!(that.options.infinite) && (that.options.currentFrame < that.options.totalFrames))) {
                            that.options.imageWidth -= that.options.frameWidth;
                            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                            that.options.imagePosX = that.options.imageWidth;
                            that._increaseFrameCount();
                        }
                    }
//if swiped < 50%  Direction:ANY
                    else if ((that.pointXOrig - that.pointX) < (that.options.frameWidth / 2) && that._flicked == false) {
                        that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
                        that.options.imagePosX = that.options.imageWidth;
                    }
//if Flicked  Direction:LTR
                    else if ((that.pointX - that.pointXOrig) && that._flicked == true && that._flickLTR == true) {

                        if (that.options.infinite || (!(that.options.infinite) && (that.options.currentFrame > 1))) {
                            that.options.imageWidth += that.options.frameWidth;
                            if (that.options.momentum) {
                                that.options.imageWidth += (that._slideImages);
                            }
                            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                            if (that.options.momentum) {
                                that.options.imageWidth -= (that._slideImages);
                                setTimeout(function () {
                                    that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                                }, that.options.transitionDuration);
                            }
                            that.options.imagePosX = that.options.imageWidth;
                            that._decreaseFrameCount();
                        } else if (!that.options.infinite && (that.options.currentFrame == 1) && that.options.momentum) {
                            that.options.imageWidth += (that.options.frameWidth / 4);
                            if (that.options.momentum) {
                                that.options.imageWidth += (that._slideImages);
                            }
                            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                            if (that.options.momentum) {
                                that.options.imageWidth -= (that._slideImages) + (that.options.frameWidth / 4);
                                setTimeout(function () {
                                    that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                                }, that.options.transitionDuration);
                            }
                            that.options.imagePosX = that.options.imageWidth;
                        }

                    }
//if Flicked  Direction:RTL
                    else if ((that.pointXOrig - that.pointX) && that._flicked == true && that._flickRTL == true) {
                        if (that.options.infinite || (!(that.options.infinite) && (that.options.currentFrame < that.options.totalFrames))) {
                            that.options.imageWidth -= that.options.frameWidth;
                            if (that.options.momentum) {
                                that.options.imageWidth -= that._slideImages;
                            }
                            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                            if (that.options.momentum) {
                                that.options.imageWidth += that._slideImages;
                                setTimeout(function () {
                                    that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                                }, that.options.transitionDuration);
                            }
                            that.options.imagePosX = that.options.imageWidth;
                            that._increaseFrameCount();
                        } else if (!that.options.infinite && (that.options.currentFrame == that.options.totalFrames && that.options.momentum)) {
                            that.options.imageWidth -= (that.options.frameWidth / 4);
                            if (that.options.momentum) {
                                that.options.imageWidth -= that._slideImages;
                            }
                            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                            if (that.options.momentum) {
                                that.options.imageWidth += that._slideImages + (that.options.frameWidth / 4);
                                setTimeout(function () {
                                    that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + 0 + 'px';
                                }, that.options.transitionDuration);
                            }
                            that.options.imagePosX = that.options.imageWidth;
                        }
                    }

//Vertical
                } else if (that.options.direction == 'vertical') {

                    //if swiped > 50%  Direction:LTR
                    if (((that.pointY - that.pointYOrig) > (that.options.frameHeight / 2)) && that._flicked == false) {
                        that.options.imageHeight += that.options.frameHeight;
                        that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                        that.options.imagePosY = that.options.imageHeight;
                        that._decreaseFrameCount();

                    }
                    //if swiped > 50%  Direction:RTL
                    else if ((that.pointYOrig - that.pointY) > (that.options.frameHeight / 2) && that._flicked == false) {
                        that.options.imageHeight -= that.options.frameHeight;
                        that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                        that.options.imagePosY = that.options.imageHeight;
                        that._increaseFrameCount();
                    }
                    //if swiped < 50%  Direction:ANY
                    else if ((that.pointYOrig - that.pointY) < (that.options.frameHeight / 2) && that._flicked == false) {

                        that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
                        that.options.imagePosY = that.options.imageHeight;
                    }
                    //if Flicked  Direction:LTR
                    else if ((that.pointY - that.pointYOrig) && that._flicked == true && that._flickLTR == true) {

                        if (that.options.infinite || (!(that.options.infinite) && (that.options.currentFrame > 1))) {
                            that.options.imageHeight += that.options.frameHeight;
                            if (that.options.momentum) {
                                that.options.imageHeight += (that._slideImages);
                            }
                            that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                            if (that.options.momentum) {
                                that.options.imageHeight -= (that._slideImages);
                                setTimeout(function () {
                                    that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                                }, that.options.transitionDuration);
                            }
                            that.options.imagePosY = that.options.imageHeight;
                            that._decreaseFrameCount();
                        } else if (!that.options.infinite && (that.options.currentFrame == 1) && that.options.momentum) {
                            that.options.imageHeight += (that.options.frameHeight / 4);
                            if (that.options.momentum) {
                                that.options.imageHeight += (that._slideImages);
                            }
                            that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                            if (that.options.momentum) {
                                that.options.imageHeight -= (that._slideImages) + (that.options.frameHeight / 4);
                                setTimeout(function () {
                                    that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                                }, that.options.transitionDuration);
                            }
                            that.options.imagePosY = that.options.imageHeight;
                        }

                    }
                    //if Flicked  Direction:RTL
                    else if ((that.pointYOrig - that.pointY) && that._flicked == true && that._flickRTL == true) {
                        if (that.options.infinite || (!(that.options.infinite) && (that.options.currentFrame < that.options.totalFrames))) {
                            that.options.imageHeight -= that.options.frameHeight;
                            if (that.options.momentum) {
                                that.options.imageHeight -= that._slideImages;
                            }
                            that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                            if (that.options.momentum) {
                                that.options.imageHeight += that._slideImages;
                                setTimeout(function () {
                                    that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                                }, that.options.transitionDuration);
                            }
                            that.options.imagePosY = that.options.imageHeight;
                            that._increaseFrameCount();
                        } else if (!that.options.infinite && (that.options.currentFrame == that.options.totalFrames && that.options.momentum)) {
                            that.options.imageHeight -= (that.options.frameHeight / 4);
                            if (that.options.momentum) {
                                that.options.imageHeight -= that._slideImages;
                            }
                            that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                            if (that.options.momentum) {
                                that.options.imageHeight += that._slideImages + (that.options.frameHeight / 4);
                                setTimeout(function () {
                                    that.scroller.style.backgroundPosition = 0 + 'px ' + that.options.imageHeight + 'px';
                                }, that.options.transitionDuration);
                            }
                            that.options.imagePosY = that.options.imageHeight;
                        }
                    }
                }

                that._animated = true;


            }
        },
        _end:function (e) {

            var that = this,
                point = hasTouch ? e.changedTouches[0] : e;

            timestamp = e.timeStamp || Date.now();

            if (timestamp - this.startTime > 100) {
                this._flicked = true;
            }

            if (timestamp - this.startTime < 60) {
                this.onClick();
            }

            if (this.panStarted == true) {
                this.onPanStopped();
            }
            this.panStarted = false;
            this.panStopped = true;


            if (!this._animated && this.options.behavior == "swipe") {
                this._animate(e);
            }

            if (hasTouch && e.touches.length != 0) {
                return;
            }


            that._unbind(MOVE_EV);
            that._unbind(END_EV);
            that._unbind(CANCEL_EV);
            if (!that.options.hasTouch) {
                that._unbind('mouseout', that.wrapper);
            }

        },

        _mouseout:function (e) {
            var t = e.relatedTarget;
            if (!t) {
                this._end(e);
                return;
            }
            while (t = t.parentNode) if (t == this.wrapper) return;
            this._end(e);
        },

        _increaseFrameCount:function () {
            var that = this,
                doc = document;
            that.options.currentFrame++;
            if (that.options.currentFrame > that.options.totalFrames) {
                that.options.currentFrame = 1;
            }
            that.onFrameChange();
        },

        _decreaseFrameCount:function () {
            var that = this,
                doc = document;
            that.options.currentFrame--;
            if (that.options.currentFrame < 1) {
                that.options.currentFrame = that.options.totalFrames;
            }
            that.onFrameChange();
        },
        onFrameChange:function () {
            //Abstract Method
            //User Defined
        },
        onPanStarted:function () {
            //Abstract Method
            //User Defined
        },
        onPanStopped:function () {
            //Abstract Method
            //User Defined
        },
        onClick:function () {
            //Abstract Method
            //User Defined
        },
        setFrameSize:function (width, height) {
            var that = this;
            that.scroller.style.width = width + 'px';
            that.scroller.style.height = height + 'px';
            that.options.frameWidth = width;
            that.options.frameHeight = height;
        },
        setFrame:function (frame) {
            var that = this;
            if (that.options.direction == 'horizontal') {
                that.options.imageWidth = (that.options.frameWidth * (frame));
            } else if (that.options.direction == 'vertical') {
                that.options.imageHeight = (that.options.frameHeight * (frame));
            }
            that.options.currentFrame = frame;
            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
            that.options.imagePosX = that.options.imageWidth;
            that.options.imagePosY = that.options.imageHeight;
        },
        addFrame:function (frame) {
            var that = this;

            if (that.options.direction == 'horizontal') {
                that.options.imageWidth -= (that.options.frameWidth * (frame));
            } else if (that.options.direction == 'vertical') {
                that.options.imageHeight -= (that.options.frameHeight * (frame));
            }
            for (i = 0; i < frame; i++) {
                that.options.currentFrame++;
                if (that.options.currentFrame > that.options.totalFrames) {
                    that.options.currentFrame = 1;
                }
            }
            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
            that.options.imagePosX = that.options.imageWidth;
            that.options.imagePosY = that.options.imageHeight;
        },
        subtractFrame:function (frame) {
            var that = this;
            if (that.options.direction == 'horizontal') {
                that.options.imageWidth += (that.options.frameWidth * (frame));
            } else if (that.options.direction == 'vertical') {
                that.options.imageHeight += (that.options.frameHeight * (frame));
            }
            for (i = 0; i < frame; i++) {
                that.options.currentFrame--;
                if (that.options.currentFrame < 1) {
                    that.options.currentFrame = that.options.totalFrames;
                }
            }
            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
            that.options.imagePosX = that.options.imageWidth;
            that.options.imagePosY = that.options.imageHeight;
        },
        setFrameWithTransition:function (frame) {
            var that = this;
            time = that.options.transitionDuration;
            time += 'ms';
            this.scroller.style[vendor + 'TransitionDuration'] = time;

            if (that.options.direction == 'horizontal') {
                that.options.imageWidth = (that.options.frameWidth * -((frame-1)));
            } else if (that.options.direction == 'vertical') {
                that.options.imageHeight = (that.options.frameHeight * -((frame-1)));
            }

            that.options.currentFrame = frame;
            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
            that.options.imagePosX = that.options.imageWidth;
            that.options.imagePosY = that.options.imageHeight;

        },
        addFrameWithTransition:function (frame) {
            var that = this;
            time = that.options.transitionDuration;
            time += 'ms';
            this.scroller.style[vendor + 'TransitionDuration'] = time;

            if (that.options.direction == 'horizontal') {
                that.options.imageWidth -= (that.options.frameWidth * (frame));
            } else if (that.options.direction == 'vertical') {
                that.options.imageHeight -= (that.options.frameHeight * (frame));
            }

            for (i = 0; i < frame; i++) {
                that.options.currentFrame++;
                if (that.options.currentFrame > that.options.totalFrames) {
                    that.options.currentFrame = 1;
                }
            }
            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
            that.options.imagePosX = that.options.imageWidth;
            that.options.imagePosY = that.options.imageHeight;
        },
        subtractFrameWithTransition:function (frame) {
            var that = this;
            time = that.options.transitionDuration;
            time += 'ms';
            this.scroller.style[vendor + 'TransitionDuration'] = time;

            if (that.options.direction == 'horizontal') {
                that.options.imageWidth += (that.options.frameWidth * (frame));
            } else if (that.options.direction == 'vertical') {
                that.options.imageHeight += (that.options.frameHeight * (frame));
            }

            for (i = 0; i < frame; i++) {
                that.options.currentFrame--;
                if (that.options.currentFrame < 1) {
                    that.options.currentFrame = that.options.totalFrames;
                }
            }
            that.scroller.style.backgroundPosition = that.options.imageWidth + 'px ' + that.options.imageHeight + 'px';
            that.options.imagePosX = that.options.imageWidth;
            that.options.imagePosY = that.options.imageHeight;
        },
        startSlideShow:function () {
            var that = this;
            that.slideShowInterval = setInterval(function () {
                if (that.options.direction == 'horizontal') {
                    if (that.options.slideShowWithTransition) {
                        if (that.options.slideShowDirection == 'RTL') {
                            that.addFrameWithTransition(1);
                        } else if (that.options.slideShowDirection == 'LTR') {
                            that.subtractFrameWithTransition(1);
                        }
                    } else {
                        if (that.options.slideShowDirection == 'RTL') {
                            that.addFrame(1);
                        } else if (that.options.slideShowDirection == 'LTR') {
                            that.subtractFrame(1);
                        }
                    }
                } else if (that.options.direction == 'vertical') {
                    if (that.options.slideShowWithTransition) {
                        if (that.options.slideShowDirection == 'DTU') {
                            that.addFrameWithTransition(1);
                        } else if (that.options.slideShowDirection == 'UTD') {
                            that.subtractFrameWithTransition(1);
                        }
                    } else {
                        if (that.options.slideShowDirection == 'UTD') {
                            that.addFrame(1);
                        } else if (that.options.slideShowDirection == 'DTU') {
                            that.subtractFrame(1);
                        }
                    }
                }
            }, that.options.slideShowDelay);
        },
        stopSlideShow:function () {
            var that = this;
            clearInterval(that.slideShowInterval);
        }

    }
    if (typeof exports !== 'undefined') exports.threeSixty = threeSixty;
    else window.threeSixty = threeSixty;
})();