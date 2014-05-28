(function(){
var PROFILE = false
//var PROFILE = true

// -----------------------------------------
// Utils
// -----------------------------------------
jQuery.fn.swap = function(b){ 
    b = jQuery(b)[0]; 
    var a = this[0]; 
    var temp = a.parentNode.insertBefore(document.createTextNode(''), a); 
    b.parentNode.insertBefore(a, b); 
    temp.parentNode.insertBefore(b, temp); 
    temp.parentNode.removeChild(temp); 
    return this; 
}

Array.prototype.insert = function(value, index){
  var array = this
    for(var i = array.length - 1; index <= i; i--){
        array[i + 1] = array[i]
    }
    array[index] = value
}

Array.prototype.insertBefore = function(from, to){
  this.insert(this[from], to)
  if(to < from){
    from += 1
  }
  this.splice(from, 1)
}
Array.prototype.swap = function(a, b){
  var temp = this[a]
  this[a] = this[b]
  this[b] = temp
}

function range(min, max){
  var array = []
  while(min < max){
    array.push(min)
    min++
  }
  return array
}

function randrange(min, max){
  return Math.floor(Math.random() * (max - min)) + min
}

function shuffle(array){
  var length = array.length
  for(var i = 0; i < length; i++){
    var j = randrange(0, length)
    var temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

window.profile = {
  nowProfiling: false,
  start: function(name){
    if(PROFILE === false) return
    if(this.nowProfiling){
      console.profileEnd()
    }
    this.nowProfiling = true
    console.profile(name)
  },
  end: function(){
    if(PROFILE === false) return
    this.nowProfiling = false
    console.profileEnd()
  }
}

// -----------------------------------------
// Queue class
// -----------------------------------------
var Queue = Class.$extend({
  __init__: function(){
    this.length = 0
    this.i = 0
    this.queue = []
  },
  
  get: function(){
    if(this.length === 0)
      return undefined
    this.length--
    return this.queue[this.i++]
  },
  
  put: function(value){
    this.queue.push(value)
    this.length++
  }
})

// -----------------------------------------
// Controller class
// -----------------------------------------
Controller = Class.$extend({
  widget: $("<span class='widget'></span>"),
  reset: $.noop,
  onSpeedChange: $.noop,
  onLengthChange: $.noop,
  
  __init__: function(defaults){
    this.element = $("<div class='controller'>")
    var restart = this._createRestartButton()
    var buttonset = this._createLengthButtonSet(defaults.length)
    var slider = this._createSpeedSlider(defaults.speed)
    this.element.append(restart).append(buttonset).append(slider)
  },

  
  _createRestartButton: function(){
    var self = this
    var button = $("<button>Restart</button>").button().click(function(){
      self.restart()
    })
    return this.widget.clone().append(button)
  },
  
  _createSpeedSlider: function(defaultSpeed){
    var self = this
    var amount = $("<span class='speed-amount'></span>").text(defaultSpeed)
    var slider = $("<span class='speed-slider'></span>")
    slider.slider({
      min: 1,
      max: 300,
      value: defaultSpeed,
      slide: function(event, ui){
        amount.text(ui.value)
        self.onSpeedChange(ui.value)
      }
    })

    var sliderWrapper = $("<span>").append(amount).append(slider)
    return this.widget.clone().text("Speed: ").append(sliderWrapper)
  },
  
  _createLengthButtonSet: function(defaultLength){
    var self = this
    var buttonset = this.widget.clone().addClass("length-button")
    var radioName = "graphical-sort-radio"
    var _label = $("<label>")
    var _radio = $("<input type='radio'>").attr("name", radioName)
    $.each([5, 10, 30, 50, 100, 200], function(i, length){
      var label = _label.clone().text(length).attr("for", radioName + length)
      var radio = _radio.clone().attr("id", radioName + length).val(length)
      buttonset.append(label).append(radio)
    })
    buttonset.find("input[value=" + defaultLength + "]").attr("checked", "checked")
    buttonset.buttonset()
    buttonset.click(function(event, ui){
      self.onLengthChange(parseInt(event.target.value))
    })
    return buttonset
  }  
})
// -----------------------------------------
// Bar class
// -----------------------------------------
var Bar = Class.$extend({
  __init__: function(value){
    this.value = value
  },
  createElement: function(){
    var bar = $("<span>")
    return bar
  }
})

// -----------------------------------------
// Bars class
// -----------------------------------------
var Bars = Class.$extend({
  __init__: function(length, container){
    this.length = length
    this.container = container
    this.bars = []
    var values = this.values = shuffle(range(1, length+1))
    
    for(var i = 0; i < length; i++){
      this.bars[i] = Bar(values[i])
    }
    this.elements = this._createElements()
  },

  swap: function(a, b, command){
    var className = "highlight"
    var elements = this.container.find("span")
    elements.removeClass(className)
    var barA = elements.eq(a)
    var barB = elements.eq(b)
    barA[0].className = barB[0].className = className
    if(command === C.swap){
      barB.swap(barA)
    }
  },
  
  insert: function(from, to){
    var elements = this.container.find("span").removeClass("highlight")
    this.container[0].insertBefore(elements.eq(from).addClass("highlight")[0], elements[to])
  },
  
  _createElements: function(){
    var elements = $()
    var length = this.length
    $.each(this.bars, function(){
      var bar = this
      var element = bar.createElement()
      element.css("width", 100 / length + "%")
      element.css("height", bar.value / length * 100 + "%")
      elements = elements.add(element)
    })
    return elements
  }
})

var Command = Class.$extend({
  __classvars__: {
    highlight: "highlight",
    swap: "swap",
    insert: "insert",
    set: "set"
  }
})
var C = Command

// -----------------------------------------
// GraphicalSort class
// -----------------------------------------
GraphicalSort = Class.$extend({
  length: 30,  // default list length
  speed: 100,  // default speed
  currentTaskId: -1,
  
  __init__: function(){},
  
  // graphical API
  compare: function(a, b){
    var command = C.highlight
    if(this.values[a] > this.values[b]){
      this.values.swap(a, b)
      command = C.swap
    }
    this.task.put([a, b, command])
  },
  
  // graphical API
  highlight: function(a, b){
    this.task.put([a, b, C.highlight])
  },
  
  // graphical API
  swap: function(a, b){
    this.values.swap( a, b)
    this.task.put([a, b, C.swap])
  },
  
  // graphical API
  insertBefore: function(from, to){
    this.values.insertBefore(from, to)
    this.task.put([from, to, C.insert])
  },
  
  show: function(viewElement){
    if(this.sortFunc === undefined){
      throw Error("sort function is undefined")
    }
    this.$sort = $("<div class='graphical-sort'>")
    this.$sort.append(this._createController().element)
    this.container = $("<div class='bars-container'>")
    this.$sort.append(this.container)
    
    viewElement.append(this.$sort)
    this.displayBars()
  },
  
  displayBars: function(){
    clearTimeout(this.currentTaskId)
    this.bars = Bars(this.length, this.container)
    this.values = this.bars.values
    this.container.empty().append(this.bars.elements)
    this._initTask()
    
    profile.start()
    this._setTimeout()
  },
  
  complete: function(){
    this.container.find("span").removeClass("highlight")
    if(this.sortFunc.name === "bogoSort"){
      if(this.bogoSortCompleted === false){
        this._initTask()
        this._setTimeout()
        return
      }
    }
    profile.end()
  },
  
  _createController: function(){
    this.controller = Controller({
      speed: this.speed,
      length: this.length
    })
    return this._setEventToController(this.controller)
  },
  
  _setEventToController: function(controller){
    var self = this
    controller.onLengthChange = function(length){
      self.length = length
      self.displayBars()
    }
    controller.onSpeedChange = function(speed){
      self.speed = speed
    }
    controller.restart = function(){
      self.displayBars()
    }
    return controller
  },

  _initTask: function(){
    this.task = Queue()
    this.sortFunc()
  },
  
  _next: function(){
    var order = this.task.get()
    if(order === undefined){
      this.complete()
      return
    }
    var command = order[2]
    if(command === C.insert){
      this.bars.insert(order[0], order[1])
    }else{
      this.bars.swap(order[0], order[1], command)
    }

    this._setTimeout()
    
  },
  
  _setTimeout: function(){
    var self = this
    var interval = 2000 / this.speed
    this.currentTaskId = setTimeout(function(){
      self._next()
    }, interval)
  }  
})

})()
