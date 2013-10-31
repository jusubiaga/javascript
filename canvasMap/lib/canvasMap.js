CanvasMap = (function(){

	function CanvasMap(containerName, imageURL, options){

        // Set Properties
        this._readOnly = false;
        this._hideAreas = false;
        if (options != null){
            this._readOnly = (options.readOnly == null ? false : options.readOnly);
            this._hideAreas = (options.hideAreas == null ? false : options.hideAreas);
        }

		this._areas = new Array();
		
		this._canvas = null;
		this._canvasContext = null;
		this._painting = false;

		this._onAreaCreating = null;
		this._onAreaCreated = null;
		this._onAreaClick = null;
		this._onAreaOver = null;
		this._onAreaRemoved = null;
		this._onAreaUpdated = null;
		this._currentAreaOver = null;

		this._startPointPos = null;

		this._imageCanvas = null;
		this._imageCanvasContext = null;
		this._imageTag = null;

		this._drawCanvas = null;
		this._drawCanvasContext = null;

		this._addWhenFinishedDrawing = true;

		this._pinImage = null;
        this._canvasAreaColor = null;

		if (this.createContext(containerName, imageURL))
		{
			this.initCanvas();	
		}		
	}

    CanvasMap.prototype.__defineSetter__("onAreaClickHandler",function(handler){
        this._onAreaClick = handler;
    });

    CanvasMap.prototype.__defineSetter__("onAreaCreatedHandler", function(handler){
        this._onAreaCreated = handler;
    });

    CanvasMap.prototype.__defineSetter__("canvasAreaColor", function(canvasAreaColor){
        this._canvasAreaColor = canvasAreaColor;
    })

	CanvasMap.prototype.createContext = function(imageMapContainer, imageURL) {
		
		var container =  null;

		if ($(imageMapContainer).is("div"))
		{
			container = imageMapContainer.get(0);
		}else{
			container = document.getElementById(imageMapContainer);	
		}
		

		if (container !== null && container !== undefined)
		{

			var width = $(container).css('width');
			var height = $(container).css('height');
			var image = imageURL === null | imageURL === undefined ? "intel-logo.png" : imageURL;

			this._imageTag = document.createElement('img');
			this._imageTag.setAttribute('src',image)
			this._imageTag.setAttribute('id', 'backgroundImg');
			this._imageTag.style.position = 'absolute';
			this._imageTag.style.width = width;
			this._imageTag.style.height = height;

			container.appendChild(this._imageTag);

            this._canvas = document.createElement('canvas');
            this._canvas.setAttribute('width', width);
            this._canvas.setAttribute('height', height);
            this._canvas.setAttribute('id', 'canvas');
            this._canvas.style.position = 'absolute';

            this._canvasContext = this._canvas.getContext("2d");

			// Drawing Canvas
			this._drawCanvas = document.createElement('canvas');
			this._drawCanvas.setAttribute('width', width);
			this._drawCanvas.setAttribute('height', height);
			this._drawCanvas.setAttribute('id', 'drawCanvas');
			this._drawCanvas.style.position = 'absolute';

			this._drawCanvasContext = this._drawCanvas.getContext("2d");

            container.appendChild(this._drawCanvas);
            container.appendChild(this._canvas);

            return true;
		}

		return false;

	};

	CanvasMap.prototype.initCanvas = function() {
		
		var self = this;

		// Start Drawing (click).
		this._canvas.addEventListener('mousedown', function(evt) {

			if (evt.button === 0)
			{
				if (self._currentAreaOver === null)
				{
					if (!self._readOnly)
					{
					  	self._painting = true;
					  	self._startPointPos = self.getMousePos(evt);
					  	console.log("Start: " + self._startPointPos.x + " " + self._startPointPos.y)											
					}
				}else{
					
					console.log("Click on Area !");

					if(self._onAreaClick != null)
					{
						console.log("Click in Area: " + JSON.stringify(self._currentAreaOver));
						self._onAreaClick(self._currentAreaOver);

					}	

				}

			}else if (evt.button === 2)
			{
				var clickPoint = self.getMousePos(evt);
				var area = self.getAreaByPoint(clickPoint);
				if (area != null)
				{
					console.log("found: " + area._startPoint.x + " " + area._startPoint.y);
				}
			}
			evt.stopPropagation();
            evt.preventDefault();

		});

		// Drawing.
		this._canvas.addEventListener('mousemove', function(evt) {
            if(self._painting)
			{
			  	var endPoint = self.getMousePos(evt);
			  	endPoint.x = endPoint.x - self._startPointPos.x;
			  	endPoint.y = endPoint.y - self._startPointPos.y;

				self.drawArea(self._startPointPos, endPoint);
			}else{

				var area = self.getAreaByPoint(self.getMousePos(evt));
				if (area != null)
				{
					if (self._currentAreaOver === null || (self._currentAreaOver != null && ! area.equals(self._currentAreaOver) ))
					{
						self._currentAreaOver = area;
						console.log("OVER AREA: " + self._currentAreaOver._startPoint.x + " " + self._currentAreaOver._startPoint.y);
						self._canvas.style.cursor = "pointer";	
					}
								
				}else{
					self._canvas.style.cursor = "default";
					self._currentAreaOver = null;
				}
			}

			evt.stopPropagation();
            evt.preventDefault();

		});

		// End Drawing
		this._canvas.addEventListener('mouseup', function(evt) {
			// Left Button.
			if (evt.button === 0 && self._painting && self._currentAreaOver === null)
			{
			  	self._painting = false;
				var endPoint = self.getMousePos(evt);
			    endPoint.x = endPoint.x - self._startPointPos.x;
			    endPoint.y = endPoint.y - self._startPointPos.y;

                if (endPoint.x < 0){

                }

			    if (!(endPoint.x === 0 && endPoint.y === 0) )
			    {
				    var newArea = new CanvasArea("Area Name", new CanvasPoint(self._startPointPos.x, self._startPointPos.y), new CanvasPoint(endPoint.x, endPoint.y),"Area Desc", self._canvasAreaColor, {hide:self._hideAreas});

				    // Area Creating. Notify.
				    if (self._onAreaCreating != null)
				    {
				    	self._onAreaCreating(newArea);	
				    }

				    if (self._addWhenFinishedDrawing)
				    {
				    	self.addArea(newArea);

				    }
			    }

				console.log("mouseup: " + endPoint.x + " " + endPoint.y);
			}
			evt.stopPropagation();
            evt.preventDefault();

		});

        this._canvas.addEventListener('touchstart',function(evt){

            var touch = self.getTouchPos(evt);
            var area = self.getAreaByPoint(touch);

            if (area != null){

                if(self._onAreaClick != null)
                {
                    self._onAreaClick(area);
                }
            }

            evt.stopPropagation();
            evt.preventDefault();

        })

		// Disable context menu
		this._canvas.oncontextmenu = function(){return false;}

		this._areas = [];
		this.redraw();

	};

	CanvasMap.prototype.setBackground = function(background) {

		if (this._imageTag)
		{
			this._imageTag.src = background;
			this.removeAllAreas();			
		}
	};

	CanvasMap.prototype.addArea = function(area) {
		
		if (area instanceof CanvasArea)
		{   // check duplicates
			// check intercepcion.
			var areaFound = this.getArea(area);
			if (areaFound !== null)
			{
				// Modify Area ...
				this._areas[areaFound.id] = area;
				if (this._onAreaUpdated !== null)
				{
					this._onAreaUpdated(area);
				}

				console.log("Area was updated!");				
			}else{
				// Add new Area ...
				this._areas.push(area);
				if (this._onAreaCreated !== null)
				{
					this._onAreaCreated(area);
				}

				console.log("Area was added!");				

			}

			this.redraw();
		}
	};

	CanvasMap.prototype.removeArea = function(point) {
		
		var self = this;
		var area = this.getAreaByPoint(point);
		if (area != null)
		{
			this._areas.splice( this._areas.indexOf(area) ,1 );
			this.redraw();	

			if (self._onAreaRemoved !== null)
			{
				self._onAreaRemoved(point);
			}
		}
		
	};

    CanvasMap.prototype.removeArea2 = function(area) {

        if (!area instanceof CanvasArea) return;

        if (area != null)
        {
            this._areas.splice( this._areas.indexOf(area) ,1 );
            this.redraw();

            if (self._onAreaRemoved !== null)
            {
                self._onAreaRemoved(point);
            }
        }

    };

    CanvasMap.prototype.setAreas = function(areas) {
		// TODO VAlidate Array
		if(areas != null)
		{
			this._areas = areas;
			this.redraw();
		}
	};

	CanvasMap.prototype.setStrAreas = function(strAreas) {
		
		if (strAreas)
		{

			strAreas = strAreas.replace(/\'/g, "\"");

			try{

				var areas =  $.parseJSON(strAreas);

				// TODO VAlidate Array
				if(areas != null)
				{
					this._areas = [];
					for (i in areas.areas)
					{
						this._areas.push(new CanvasArea(areas.areas[i]._name, areas.areas[i]._startPoint, areas.areas[i]._offsetPoint), areas.areas[i]._desc, areas.areas[i]._areaColor, {hide:self._hideAreas});
					}

					this.redraw();
				}

			}catch(e)
			{
				console.log("[CanvasMap.prototype.setStrAreas] Invalid JSON");
			}

		}


	};

	CanvasMap.prototype.toJSON = function() {
		var obj = JSON.stringify(this._areas);
		obj = "{\"areas\": " + obj + "}";

		return obj.replace(/\"/g, "\'");;
		
	};

	CanvasMap.prototype.getAreaByPoint = function(point) {
		
		for(i in this._areas)
		{
			if (this._areas[i].isInArea(point) )
			{
				return this._areas[i];
			}
		}

		return null;
	};

	CanvasMap.prototype.getArea = function(area) {
		
		if (area instanceof CanvasArea)
		{
			for(var i in this._areas)
			{
				if (this._areas[i].equals(area) )
				{
					return {id: i, area: this._areas[i]};
				}
			}			
		}

		return null;
	};

	// Internal Function for clean canvas.
	CanvasMap.prototype.cleanAll = function() {
        this._canvasContext.clearRect(0, 0, this._canvasContext.canvas.width, this._canvasContext.canvas.height);
		this._drawCanvasContext.clearRect(0, 0, this._drawCanvasContext.canvas.width, this._drawCanvasContext.canvas.height);
	};

	// Function for remove all areas and clean canvas.
	CanvasMap.prototype.removeAllAreas = function() {
		this.cleanAll();
		this._areas = [];		
	};

	CanvasMap.prototype.drawArea = function(startPoint, endPoint) {
		if (this._painting)
		{
			this._drawCanvasContext.beginPath();
			this._drawCanvasContext.clearRect(0, 0, this._drawCanvasContext.canvas.width, this._drawCanvasContext.canvas.height);
			this._drawCanvasContext.rect(startPoint.x,startPoint.y,endPoint.x,endPoint.y);
			this._drawCanvasContext.closePath();
			this._drawCanvasContext.stroke();
		}
	};

	CanvasMap.prototype.redraw = function() {
		
		this.cleanAll();

		for (var i in this._areas)
		{
			this._areas[i].draw(this._canvasContext);
		}		
	};

    CanvasMap.prototype.scale = function(percent){
        var width = $("#canvas").width();
        var height = $("#canvas").height();

        width = width * percent / 100;
        height = height * percent / 100;

        $("#backgroundImg").css('width',width);
        $("#backgroundImg").css('height',height);

        $("#canvas").attr('width',width);
        $("#canvas").attr('height',height);

        $("#drawCanvas").attr('width',width);
        $("#drawCanvas").attr('height',height);

        for (var i in this._areas){
            this._areas[i].scale(percent);
        }
        this.redraw();
    }

    CanvasMap.prototype.resize = function(newwidth, newheight){
//        var width = $("#canvas").width();
//        var height = $("#canvas").height();
//
//        var widthResult = newwidth - width
//        var heightResult =
//
    }


	// Internal function to get mouse position.
	CanvasMap.prototype.getMousePos = function(evt) {
		var rect = this._drawCanvas.getBoundingClientRect();

        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
	};

    // Internal function to get touch position.
    CanvasMap.prototype.getTouchPos = function(evt) {
        var rect = this._canvas.getBoundingClientRect();
        var touchobj = evt.changedTouches[0] // reference first touch point (ie: first finger)
        startx = parseInt(touchobj.clientX);
        starty = parseInt(touchobj.clientY);

        return {
            x: startx - rect.left,
            y: starty - rect.top
        };
    };

	return CanvasMap;
})();

CanvasPoint = (function(){
    function CanvasPoint(x,y){
        this._x = x;
        this._y = y;
    };

    CanvasPoint.prototype.__defineGetter__("x",function(){
        return this._x;
    });

    CanvasPoint.prototype.__defineGetter__("y",function(){
        return this._y;
    });

    CanvasPoint.prototype.__defineSetter__("x",function(x){
        this._x = x;
    })

    CanvasPoint.prototype.__defineSetter__("y",function(y){
        this._y = y;
    })

    return CanvasPoint;

})();

CanvasArea = (function(){

    var DEFAULT_FILL_COLOR = "#62c462"; //"#ff0000"

	function CanvasArea(name, startPoint, offsetPoint, desc, fillColor, options)
	{
		this._name = name;
		this._desc = desc;
		this._startPoint = startPoint;
		this._offsetPoint = offsetPoint;
        this._fillColor = fillColor;
        if (this._fillColor == undefined){
            this._fillColor = DEFAULT_FILL_COLOR;
        }

        this._hide = false;

        // Set Canvas Area options
        if (options != null)
        {
            this._hide = (options.hide === undefined ? false : options.hide);
        }

	};

    CanvasArea.prototype.__defineGetter__("name",function(){
        return this._name;
    });

    CanvasArea.prototype.__defineGetter__("desc",function(){
        return this._desc;
    });

    CanvasArea.prototype.__defineGetter__("startPoint", function(){
        return this._startPoint;
    });

    CanvasArea.prototype.__defineGetter__("offsetPoint",function(){
        return this._offsetPoint;
    });

    CanvasArea.prototype.__defineSetter__("name",function(name){
        this._name = name;
    })

    CanvasArea.prototype.__defineSetter__("desc",function(desc){
        this._desc = desc;
    })

    CanvasArea.prototype.__defineSetter__("startPoint",function(startPoint){
        if (startPoint instanceof CanvasPoint){
            this._startPoint = startPoint;
        }
    })

    CanvasArea.prototype.__defineSetter__("offsetPoint",function(offsetPoint){
        if (offsetPoint instanceof CanvasPoint){
            this._offsetPoint = offsetPoint;
        }
    })

	CanvasArea.prototype.isInArea = function(point) {
        // TODO Improve this method!!

        var p1 = {x: this._startPoint.x, y:this._startPoint.y};
        var p2 = {x:this._startPoint.x + this._offsetPoint.x, y:this._startPoint.y + this._offsetPoint.y}

        if (p1.x < p2.x && p1.y < p2.y){
            // nothing
        }

        if (p1.x > p2.x && p1.y < p2.y){
            var x = p1.x;
            p1.x = p2.x;
            p2.x = x;
        }

        if (p1.x < p2.x && p1.y > p2.y){
            var y = p1.y;
            p1.y = p2.y;
            p2.y = y;
        }

        if (p1.x > p2.x && p1.y > p2.y){
            var x = p1.x;
            var y = p1.y;
            p1.x = p2.x;
            p1.y = p2.y;
            p2.x = x;
            p2.y = y;
        }

        if (point.x >= p1.x &&
            point.y >= p1.y &&
            point.x <= p2.x &&
            point.y <= p2.y)
        {
            return true;
        }

		return false;
	};

	CanvasArea.prototype.onClick = function(point, action) {
		// if point is in area execute action.
		if (isInArea(point) && (action != null || action != "undefined"))
		{
			action();
		}
	};

	CanvasArea.prototype.draw = function(context) {
		
        var self = this;
		context.clearRect(this._startPoint.x,this._startPoint.y,this._offsetPoint.x,this._offsetPoint.y);

		context.beginPath();
        if (this._hide){
            context.globalAlpha=0;
        }else{
            context.globalAlpha=0.4;
        }
        context.fillStyle = this._fillColor;
    	context.fillRect(this._startPoint.x,this._startPoint.y,this._offsetPoint.x,this._offsetPoint.y);

		context.closePath();
		context.stroke();
	};

	CanvasArea.prototype.equals = function(canvasArea) {
		if (canvasArea instanceof CanvasArea)
		{
			if (canvasArea._startPoint.x === this._startPoint.x && 
				canvasArea._startPoint.y === this._startPoint.y && 
				canvasArea._offsetPoint.x === this._offsetPoint.x && 
				canvasArea._offsetPoint.y === this._offsetPoint.y)
			{
				return true;				
			}
		}

		return false;
	};

    CanvasArea.prototype.scale = function(percent){
        this._startPoint.x = this._startPoint.x * percent / 100;
        this._startPoint.y = this._startPoint.y * percent / 100;
        this._offsetPoint.x = this._offsetPoint.x * percent / 100;
        this._offsetPoint.y = this._offsetPoint.y * percent / 100;
    }

	return CanvasArea;

})();