// Shim by Paul Irish
      // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
      window.requestAnimFrame = (function() {
        return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
      })();
      
      // Draw.
      
      function Stage(id) {
        this.el = document.getElementById(id);
        
        this.position();
        this.listeners();
        this.hitZones = [];
        return this;
      }
      
      Stage.prototype.position = function() {
        var offset = this.offset();
        this.positionTop = Math.floor(offset.left);
        this.positionLeft = Math.floor(offset.top);
      };
      
      Stage.prototype.offset = function() { 
        var _x, _y,
        el = this.el;
        
        if (typeof el.getBoundingClientRect !== "undefined") {
            return el.getBoundingClientRect();
        } else {
            _x = 0;
            _y = 0;
            while(el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
                _x += el.offsetLeft;
                _y += el.offsetTop;
                el = el.offsetParent;
            }
            return { top: _y - window.scrollY, left: _x - window.scrollX };
        }
      };
      
      Stage.prototype.listeners = function() {
        var _self = this;

        _self.dragging = false;
        _self.limit = false;
        
        window.addEventListener('resize', function() {
            _self.position();
        }, false);
        
        window.addEventListener('scroll', function() {
            _self.position();
        }, false);
        
        this.el.addEventListener('mousedown', function(e) {
            var x = e.clientX - _self.positionTop,
            y = e.clientY - _self.positionLeft;
            
            _self.hitZones.forEach(function(zone) {
                _self.checkPoint(x, y, zone);
            });
            
            _self.dragging = true;
            _self.prev = [x, y];
        }, false);

        
        document.addEventListener('mousemove', function(e) {
            var x, y;

            if (!_self.dragging || _self.limit) return;
            _self.limit = true;
            
            x = e.clientX - _self.positionTop,
            y = e.clientY - _self.positionLeft;
            

            _self.hitZones.forEach(function(zone) {
                _self.checkIntercept(_self.prev[0], 
                    _self.prev[1],
                    x, 
                    y,
                    zone);
            });

            _self.prev = [x, y];
            
            setInterval(function() {
                _self.limit = false;
            }, 50);      
        }, false);
        
        document.addEventListener('mouseup', function(e) {
            var x, y;
            
            if (!_self.dragging) return;
            _self.dragging = false;
            
            x = e.clientX - _self.positionTop,
            y = e.clientY - _self.positionLeft;

            _self.hitZones.forEach(function(zone) {
                _self.checkIntercept(_self.prev[0], 
                    _self.prev[1],
                    x, 
                    y,
                    zone);
            });
        }, false);
      };
      
      Stage.prototype.check = function(x, y, zone) {
        if(!zone.el) return;
        
        if(zone.inside(x, y)){
            zone.el.classList.add('hit');
            this.el.classList.add('active');
        }else{
            zone.el.classList.remove('hit');
            this.el.classList.remove('active');
        }
      };
      
      Stage.prototype.addRect = function(id) {
        var el = document.getElementById(id),
        rect = new Rect(el.offsetLeft, 
            el.offsetTop, 
            el.offsetWidth, 
            el.offsetHeight  
            );
        rect.el = el;
        
        this.hitZones.push(rect);
        return rect;
      };
      
      Stage.prototype.addString = function(rect, string) {
        rect.string = string;
        
        this.hitZones.push(rect);
        return rect;
      }; 

      Stage.prototype.checkPoint = function(x, y, zone) {
        if(zone.inside(x, y)) {
            zone.string.strum(getAudioID(x, y));
        }
      };  

      Stage.prototype.checkIntercept = function(x1, y1, x2, y2, zone) {
        if(zone.intercept(x1, y1, x2, y2)) {
            zone.string.strum(getAudioID(x1, y1));

        }
      }; 

      
      function Rect(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        return this;
      }

      Rect.prototype.inside = function(x,y) {
        return x >= this.x && y >= this.y
        && x <= this.x + this.width
        && y <= this.y + this.height;
      };
      
      Rect.prototype.midLine = function() {
        if (this.middle) return this.middle;
        
        this.middle = [
        {x: this.x, y: this.y + this.height / 2},
        {x: this.x + this.width, y: this.y + this.height / 2}
        ]
        return this.middle;
      };

      Rect.prototype.intercept = function(x1, y1, x2, y2) {
        var result = false,
        segment = this.midLine(),
        start = {x: x1, y: y1},
        end = {x: x2, y: y2};

        return this.intersectLine(segment[0], segment[1], start, end);
      };

      Rect.prototype.intersectLine = function(a1, a2, b1, b2) {
        //-- http://www.kevlindev.com/gui/math/intersection/Intersection.js

        var result,
        ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
        ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
        u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
        
        if (u_b != 0) {
            var ua = ua_t / u_b;
            var ub = ub_t / u_b;
            
            if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                result = true;
            } else {
              result = false; //--"No Intersection"
          }
      } else {
        if (ua_t == 0 || ub_t == 0) {
              result = false; //-- Coincident"
          } else {
              result = false; //-- Parallel
          }
      }
      
      return result;
  };
  
  
  function GuitarString(rect) {
    this.x = rect.x;
    this.y = rect.y + rect.height / 2 ;
    this.width = rect.width;
    this._strumForce = 0;
    this.a = 0;
  }
  
  GuitarString.prototype.strum = function() {
    this._strumForce = 5;
  };
  
  GuitarString.prototype.render = function(ctx, canvas) {
    
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.bezierCurveTo(
        this.x, this.y + Math.sin(this.a) * this._strumForce,
        this.x + this.width, this.y + Math.sin(this.a) * this._strumForce,
        this.x + this.width, this.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 4);
    ctx.bezierCurveTo(
        this.x, this.y + 4 + Math.sin(this.a) * this._strumForce,
        this.x + this.width, this.y  + 4+ Math.sin(this.a) * this._strumForce,
        this.x + this.width, this.y + 4);
    ctx.stroke();

    this._strumForce *= 0.95;
    this.a += 0.5;
  };


  function StringInstrument(stageID, canvasID, stringNum){
    this.strings = [];
    this.canvas = document.getElementById(canvasID);
    this.stage = new Stage(stageID);
    this.ctx = this.canvas.getContext('2d');
    this.stringNum = stringNum;
    
    this.create();
    this.render();
    
    return this;
  }
  
  StringInstrument.prototype.create = function() {
    
    for (var i = 0; i < this.stringNum; i++) {
        var srect = new Rect(12, 185 + i * 20, 1220, 10);
        var s = new GuitarString(srect);

        this.stage.addString(srect, s);
        this.strings.push(s);
    }
  };
  
  StringInstrument.prototype.render = function() {
    var _self = this;
    
    requestAnimFrame(function(){
        _self.render();
    });
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (var i = 0; i < this.stringNum; i++) {
        this.strings[i].render(this.ctx);
    }
  };
  
  
  var guitar = new StringInstrument("stage", "strings", 3);

  
      // sound
      var firstStringCoords = {
        0: {
            start:0,
            length:0.9
        },
        1: {
            start:2.184,
            length:1.184
        },
        2: {
            start:3.698,
            length:1.638
        },
        3: {
            start:5.608,
            length:1.080
        },
        4: {
            start:7.041,
            length:1.318
        },
        5: {
            start:8.887,
            length:0.824
        },
        6: {
            start:10.06,
            length:0.935
        },
        7: {
            start:11.401,
            length:0.819
        },
        8: {
            start:12.655,
            length:1.225
        },
        9: {
            start:14.298,
            length:0.482
        },
        10: {
            start:15.290,
            length:0.772
        },
        11: {
            start:16.823,
            length:0.877
        },
        12: {
            start:18.065,
            length:0.877
        },
        13: {
            start:19.423,
            length:0.57
        },
        14: {
            start:20.434,
            length:1.062
        },
        15: {
            start:21.821,
            length:0.726
        },
        16: {
            start:22.965,
            length:0.743
        },
        17: {
            start:24.276,
            length:0.615
        },
        18: {
            start:25.258,
            length:1.1
        },
        19: {
            start:26.610,
            length:1.306
        }

        
      };


       // sound
       var secondStringCoords = {
        0: {
            start:0,
            length:0.6
        },
        1: {
            start:1.904,
            length:0.848
        },
        2: {
            start:3.5,
            length:1.08
        },
        3: {
            start:5.123,
            length:0.58
        },
        4: {
            start:6.177,
            length:1
        },
        5: {
            start:7.5,
            length:0.755
        },
        6: {
            start:8.626,
            length:0.685
        },
        7: {
            start:9.776,
            length:0.708
        },
        8: {
            start:10.913,
            length:0.685
        },
        9: {
            start:12.016,
            length:0.615
        },
        10: {
            start:13.653,
            length:1
        },
        11: {
            start:15.348,
            length:0.917
        },
        12: {
            start:16.742,
            length:0.755
        },
        13: {
            start:17.937,
            length:0.766
        },
        14: {
            start:19.052,
            length:0.906
        },
        15: {
            start:20.596,
            length:0.894
        },
        16: {
            start:22.024,
            length:0.546
        },
        17: {
            start:23.31,
            length:0.592
        },
        18: {
            start:24.845,
            length:1
        },
        19: {
            start:26.459,
            length:0.801
        }
       };

    // sound
    var thirdStringCoords = {
        0: {
            start:0,
            length:0.708
        },
        1: {
            start:1.672,
            length:0.882
        },
        2: {
            start:3.11,
            length:0.708
        },
        3: {
            start:4.365,
            length:0.650
        },
        4: {
            start:5.782,
            length:0.720
        },
        5: {
            start:6.896,
            length:1
        },
        6: {
            start:8.290,
            length:0.650
        },
        7: {
            start:9.346,
            length:0.906
        },
        8: {
            start:10.646,
            length:0.766
        },
        9: {
            start:11.761,
            length:0.546
        },
        10: {
            start:13.131,
            length:0.615
        },
        11: {
            start:14.385,
            length:0.836
        },
        12: {
            start:15.615,
            length:0.743
        },
        13: {
            start:16.939,
            length:0.348
        },
        14: {
            start:17.856,
            length:0.743
        },
        15: {
            start:19.122,
            length:0.464
        },
        16: {
            start:20.329,
            length:0.557
        },
        17: {
            start:21.548,
            length:0.627
        },
        18: {
            start:22.639,
            length:0.673
        },
        19: {
            start:23.835,
            length:0.546
        }
    };
      // audio sprite.

      var firstString = new AudioSprite('mp3/first.mp3');
      var secondString = new AudioSprite('mp3/second.mp3');
      var thirdString = new AudioSprite('mp3/third.mp3');

      firstString.load();
      secondString.load();
      thirdString.load();


      function getAudioID(x, y){
        
        var coords = thirdStringCoords;

        // top.
        if(y >= 186 && y <= 195){
            coords = thirdStringCoords;
            sprite = thirdString;
        }
        // bottom.
        else if(y >= 225 && y <= 235){
            coords = firstStringCoords;
            sprite = firstString;
        } else if(y >= 205 && y <= 215){
            coords = secondStringCoords;
            sprite = secondString;
        }

        if(x >= 636 && x <= 1203) {
            sprite.play(coords[0].start, coords[0].length);
        }
        //1
        if(x >= 12 && x <= 45) {
            sprite.play(coords[1].start, coords[1].length);
        }
        //2
        if(x >= 47 && x <= 75) {
            sprite.play(coords[2].start, coords[2].length);
        }
        //3
        if(x >= 79 && x <= 107) {
            sprite.play(coords[3].start, coords[3].length);
        }
        //4
        if(x >= 111 && x <= 167) {
            sprite.play(coords[4].start, coords[4].length);
        }
        //5
        if(x >= 173 && x <= 197) {
            sprite.play(coords[5].start, coords[5].length);
        }
        //6
        if(x >= 201 && x <= 226) {
            sprite.play(coords[6].start, coords[6].length);
        }
        //7
        if(x >= 229 && x <= 276) {
            sprite.play(coords[7].start, coords[7].length);
        }
        //8
        if(x >= 280 && x <= 330) {
            sprite.play(coords[8].start, coords[8].length);
        }
        //9
        if(x >= 335 && x <= 352) {
            sprite.play(coords[9].start, coords[9].length);
        }
        //10
        if(x >= 356 && x <= 374) {
            sprite.play(coords[10].start, coords[10].length);
        }
        //11
        if(x >= 377 && x <= 415) {
            sprite.play(coords[11].start, coords[10].length);
        }
        //12
        if(x >= 419 && x <= 435) {
            sprite.play(coords[12].start, coords[11].length);
        }
        //13
        if(x >= 441 && x <= 455) {
            sprite.play(coords[13].start, coords[12].length);
        }
        //14
        if(x >= 463 && x <= 498) {
            sprite.play(coords[14].start, coords[13].length);
        }
        //15
        if(x >= 502 && x <= 532) {
            sprite.play(coords[15].start, coords[14].length);
        }
        //16
        if(x >= 536 && x <= 549) {
            sprite.play(coords[16].start, coords[15].length);
        }
        //17
        if(x >= 555 && x <= 568) {
            sprite.play(coords[17].start, coords[16].length);
        }
        //18
        if(x >= 573 && x <= 601) {
            sprite.play(coords[18].start, coords[17].length);
        }
        if(x >= 603 && x <= 629) {
            sprite.play(coords[19].start, coords[18].length);
        }


    }