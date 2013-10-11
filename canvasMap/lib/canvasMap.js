CanvasMap = (function(){
	
	function CanvasMap(containerName, imageURL, readOnly){


		this._readOnly = (readOnly === undefined ? false : readOnly);
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

		if (this.createContext(containerName, imageURL))
		{
			this.initCanvas();	
		}		
	}

    CanvasMap.prototype.__defineGetter__("onAreaClickHandler",function(){
        return this._onAreaClick;
    });

    CanvasMap.prototype.__defineSetter__("onAreaClickHandler",function(handler){
        this._onAreaClick = handler;
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

			//'http://www.allpeoplestalk.com/wp-content/uploads/2013/07/facts-about-the-human-body.jpg'
			this._imageTag = document.createElement('img');
			this._imageTag.setAttribute('src',image)
			this._imageTag.setAttribute('id', 'backgroundImg');
			this._imageTag.style.position = 'absolute';
			this._imageTag.style.width = width;
			this._imageTag.style.height = height;

			container.appendChild(this._imageTag);

			// Drawing Canvas
			this._drawCanvas = document.createElement('canvas');
			this._drawCanvas.setAttribute('width', width);
			this._drawCanvas.setAttribute('height', height);
			this._drawCanvas.setAttribute('id', 'drawCanvas');
			this._drawCanvas.style.position = 'absolute';
			container.appendChild(this._drawCanvas);
			this._drawCanvasContext = this._drawCanvas.getContext("2d");

			this._canvas = this._drawCanvas;
			this._canvasContext = this._drawCanvasContext; 			

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
				console.log("right " + clickPoint.x + " " + clickPoint.y);
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

			    if (!(endPoint.x === 0 && endPoint.y === 0) )
			    {
				    var newArea = new CanvasArea("Area Name", new CanvasPoint(self._startPointPos.x, self._startPointPos.y), new CanvasPoint(endPoint.x, endPoint.y));

				    // Area Creating. Notify.
				    if (self._onAreaCreating != null)
				    {
				    	self._onAreaCreating(newArea);	
				    }

				    if (self._addWhenFinishedDrawing)
				    {
				    	self.addArea(newArea);

				    }
    		  //   	self._areas.push(newArea);

				    // self.redraw();			    	

				    
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

		// this._canvas.addEventListener('mouseleave', function(evt) {
		// 	self._painting = false;
		// 	var mousePos = self.getMousePos(evt);
		// 	console.log("mouseleave: " + mousePos.x + " " + mousePos.y);

		// }, false);


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




			//area.draw(this._canvasContext);
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
						this._areas.push(new CanvasArea(areas.areas[i]._name, areas.areas[i]._startPoint, areas.areas[i]._offsetPoint));
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
		
		for(var i in this._areas)
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
	};

	// Function for remove all areas and clean canvas.
	CanvasMap.prototype.removeAllAreas = function() {
		this.cleanAll();
		this._areas = [];		
	};

	CanvasMap.prototype.drawArea = function(startPoint, endPoint) {
		if (this._painting)
		{
			this._canvasContext.beginPath();
			//this._canvasContext.clearRect(0, 0, this._canvasContext.canvas.width, this._canvasContext.canvas.height);			
			this._canvasContext.clearRect(startPoint.x, startPoint.y, endPoint.x, endPoint.y);			
			this._canvasContext.rect(startPoint.x,startPoint.y,endPoint.x,endPoint.y);
			this._canvasContext.closePath();
			this._canvasContext.stroke();
		}
	};

	CanvasMap.prototype.redraw = function() {
		
		this.cleanAll();

		for (var i in this._areas)
		{
			this._areas[i].draw(this._canvasContext);
		}		
	};

	// Internal function to get mouse position.
	CanvasMap.prototype.getMousePos = function(evt) {
		var rect = this._canvas.getBoundingClientRect();
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

	function CanvasArea(name, startPoint, offsetPoint, desc, eventMsg)
	{
		this._name = name;
		this._desc = desc;
		this._startPoint = startPoint;
		this._offsetPoint = offsetPoint;
        this._eventMsg = eventMsg;
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
		if (point.x > this._startPoint.x && 
			point.y > this._startPoint.y && 
			point.x < this._startPoint.x + this._offsetPoint.x && 
			point.y < this._startPoint.y + this._offsetPoint.y)
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
		context.globalAlpha=0.3;
		context.fillStyle="#00CC33";		
    	context.fillRect(this._startPoint.x,this._startPoint.y,this._offsetPoint.x,this._offsetPoint.y);
		//context.rect(this._startPoint.x,this._startPoint.y,this._offsetPoint.x,this._offsetPoint.y);

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

	return CanvasArea;

})();