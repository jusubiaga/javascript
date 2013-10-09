var Paginator = (function(){

    // do not change !
    var FIRST_PAGE = 1;
    var FIRST_PAGE_GROUP = 0;
    var DEFAULT_PAGE_SIZE = 20;
    var DEFAULT_PAGES_GROUP_SIZE = 5;

	function Paginator(options){

		// Configuration ...
        // totalElements:
        // pageSize:
        // pagesGroupSize:
        // i.e var options = {"totalElements":165,"pageSize":20, "pagesWindowSize":5, "pagesGroupSize":5};
        this.init(options);
	}

    Paginator.prototype.init = function(options){
        this._totalElements = (options.totalElements !== undefined ? options.totalElements : 0);
        this._pageSize = (options.pageSize !== undefined ? options.pageSize : DEFAULT_PAGE_SIZE);
        this._pagesGroupSize = (options.pagesGroupSize !== undefined ? options.pagesGroupSize : DEFAULT_PAGES_GROUP_SIZE);
        this.setTotalElements(this._totalElements);
    }

    Paginator.prototype.setTotalElements = function(totalElements){
        this._totalElements = (totalElements !== undefined ? totalElements : this._totalElements);
        this._totalPages = Math.ceil(this._totalElements / this._pageSize);
        this._currentPage = (this._totalPages > 0 ? FIRST_PAGE : 0);
        this.initPagesGroup();
    }

    Paginator.prototype.initPagesGroup = function() {
        this._pagesGroup = [];
        var pagesList = []
        for (var page = 1; page <= this._totalPages; page++ ){
            pagesList.push(page);
            if (page % this._pagesGroupSize == 0){
                this._pagesGroup.push(pagesList);
                pagesList = [];
            }
        }
        this._pagesGroup.push(pagesList);
        this._currentGroup = FIRST_PAGE_GROUP;
    };

	Paginator.prototype.currentPage = function() {
		return this._currentPage;
	};

    Paginator.prototype.totalPages = function(){
        return this._totalPages;
    };

    Paginator.prototype.pageSize = function(){
        return this._pageSize;
    }

    Paginator.prototype.firstItemInPage = function(){
        return (this.currentPage() == FIRST_PAGE ? FIRST_PAGE : (this.currentPage() - 1) * this.pageSize() + 1);
    }

    Paginator.prototype.lastItemInPage = function(){
        return this.currentPage() * this.pageSize();
    }

	Paginator.prototype.gotoPage = function(page) {
		if (page >= FIRST_PAGE && page <= this._totalPages){
			this._currentPage = page;	
		}		
	};

	Paginator.prototype.firstPage = function() {
		this._currentPage = FIRST_PAGE;
        this._currentGroup = FIRST_PAGE_GROUP;
		return this._currentPage;
	};

	Paginator.prototype.lastPage = function() {
		this._currentPage = this._totalPages;
		this._currentGroup = this._pagesGroup.length - 1;
        //this._currentPagesGroup = this._pagesGroup[this._currentGroup];
		return this._currentPage;
	};

	Paginator.prototype.nextPage = function() {
		if (this._currentPage < this._totalPages){
			this._currentPage++;
			if (this._currentPage > this.currentGroupUpperLimit()) this.movePagesGroup(1);
		}
		return this._currentPage;
	};

	Paginator.prototype.prevPage = function() {
		if (this._currentPage > 1 ){
			this._currentPage--;
			
			if (this._currentPage < this.currentGroupLowerLimit()) {
				//var offset = (this._currentPage - this._pagesWindowSize - 1 > 0 ? this._currentPage - this._pagesWindowSize - 1 : 1);
				//this.calculateWindow(offset);
                this.movePagesGroup(-1);
			}	
		}
		return this._currentPage;		
	};

    Paginator.prototype.nextGroup = function(){
        this.movePagesGroup(1);
        this._currentPage = this.currentGroupLowerLimit();
    }

    Paginator.prototype.prevGroup = function(){
        this.movePagesGroup(-1);
        this._currentPage = this.currentGroupLowerLimit();
    }

	Paginator.prototype.getPagesGroupSize = function() {
		return this._pagesGroupSize;
	};

    Paginator.prototype.movePagesGroup = function(offset){
        if (this._currentGroup + offset >=0 && this._currentGroup + offset < this._pagesGroup.length){
            this._currentGroup += offset;
        }

        return this.currentPagesGroup();
    }

    Paginator.prototype.currentPagesGroup = function(){
        return this._pagesGroup[this._currentGroup];
    }

    Paginator.prototype.currentGroupLowerLimit = function(){
        return this._currentGroupLowerLimit= this._pagesGroup[this._currentGroup][0];
    }

    Paginator.prototype.currentGroupUpperLimit = function(){
        return this._pagesGroup[this._currentGroup][this._pagesGroup[this._currentGroup].length-1];
    }

    Paginator.prototype.isFirstPagesGroup = function(){
        return this._currentGroup == FIRST_PAGE_GROUP;
    }

    Paginator.prototype.isLastPagesGroup = function(){
        return this._currentGroup == this._pagesGroup.length - 1;
    }

    Paginator.prototype.morePages = function(){
        return this._currentGroup < this._pagesGroup.length - 1;
    }

	return Paginator;

})()