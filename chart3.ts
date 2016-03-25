/*
declare var d3:any;
declare var _:any;
declare var moment:any;
declare var $:any;
declare var pulseFlat;
declare var sysFlat;
declare var diasFlat;
declare var timestampFlat;
*/
//declare var data:[any];



import * as _ from 'lodash';
var d3=require("d3/d3.min");
var moment=require('moment');
var $=require('jquery');


/*var data=_.zip(pulseFlat, sysFlat, diasFlat, timestampFlat).map(e=>{
  return {
    pulse: e[0],
    sys: e[1],
    dias: e[2],
    timestamp: new Date(e[3]*1000)
  };
});*/

if(_.isUndefined(d3.selection.prototype.moveToFront)){
  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };
}

interface MarginSize{
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface Opts{
  margin?: MarginSize;
  height?: number;
  width?: number;
  sysLimit?: number;
  diasLimit?: number;
  tickStart?: number;
  tickEnd?: number;
  tickInterval?: number;
  barSize?: number;
  circleSize?: number;
  limit?: number;
}

interface Data{
  pulse: number;
  sys: number;
  dias: number;
  timestamp: Date;
  special?: boolean;
}
export default class MedChart{
//class MedChart{
  defaults: Opts={
    margin: {
      top: 20,
      right: 10,
      bottom: 30,
      left: 50
    },
    sysLimit: 160,
    diasLimit: 100,
    height: 300,
    width: 640,
    tickStart: 50,
    tickEnd: 200,
    tickInterval: 15,
    barSize: 20,
    circleSize: 3,
    limit: 200
  }
  svg:any;
  
  constructor(public data:[Data], public selector:string, public brushSelector:string, public opts:Opts={}){
    _.defaultsDeep(this.opts, this.defaults);
    this.data=this.parseData(data);
    this.setup();
  }
  
  update(data):void{
    this.data=this.parseData(data);
    this.updateBar();
    this.updateLines();
    this.updateOverlayLines();
    this.updateCircles();
    this.setupTooltips();
    //setupOverflowBoxes();
    this.updateAxes();
    this.svg.selectAll(".line").moveToFront();
    this.svg.selectAll(".overlay-line").moveToFront();
    this.brushed();
    
  }
  
  private parseData(data):[Data]{
    return _(data).map(d=>{
      return _.assign({}, d, {
        timestamp: _.isDate(d.timestamp) ? d.timestamp : moment(d.timestamp).toDate()
      });
    }).takeRight(this.opts.limit).value();
  }
  
  private setup():void{
    this.setupChart();
    this.setupScales();
    this.opts.barSize=this.currentBarWidth();
    this.setupBar();
    this.setupCircles();
    this.setupLines();
    this.setupClips();
    this.setupViewboardClip();
    this.setupAxes();
    this.setupBrush();
    this.setupBrushAxes();
    this.setupOverlayLines();
    this.setupTooltips();
  }
  /*
███████  ██████  █████  ██      ███████ ███████ 
██      ██      ██   ██ ██      ██      ██      
███████ ██      ███████ ██      █████   ███████ 
     ██ ██      ██   ██ ██      ██           ██ 
███████  ██████ ██   ██ ███████ ███████ ███████ 
*/
  xScale; yScale; xAxis; yAxis; xExtent; xAxisElem; yAxisElem;initialExtent;
  setupScales():void{
    this.initialExtent=[
      moment(_.last(this.data).timestamp).subtract(100, "hours").toDate(),
      _.last(this.data).timestamp
    ];
    
    this.xExtent=[_.first(this.data).timestamp, _.last(this.data).timestamp];
    this.xScale=d3.time.scale()
      .domain(this.initialExtent)
      .range([this.opts.margin.left, this.opts.width-this.opts.margin.right]);
    this.yScale=d3.scale.linear()
      .domain([this.opts.tickStart, Math.max(d3.max(this.data, d=>d.pulse), this.opts.tickEnd)])
      .range([this.opts.height-this.opts.margin.top-this.opts.margin.bottom, this.opts.margin.top]);
    this.brushScale=d3.time.scale()
      .domain(this.xExtent)
      .range([0, this.opts.width]);
  }
  /*
 █████  ██   ██ ███████ ███████ 
██   ██  ██ ██  ██      ██      
███████   ███   █████   ███████ 
██   ██  ██ ██  ██           ██ 
██   ██ ██   ██ ███████ ███████ 
*/
  private setupAxes():void{
    this.xAxis=d3.svg.axis()
      .scale(this.xScale)
      .tickSize(3)
      .innerTickSize(-this.opts.width)
      .orient("bottom");

    this.yAxis=d3.svg.axis()
      .tickValues(this.calcTicks())
      .scale(this.yScale)
      .tickSize(3)
      .innerTickSize(-this.opts.width)
      .orient("left");
      
    this.xAxisElem=this.svg
      .append("g")
      .attr("transform", `translate(0, ${this.opts.height-this.opts.margin.top-this.opts.margin.bottom})`)
      .attr("class", "x axis")
      .call(this.xAxis);
    this.yAxisElem=this.svg
      .append("g")
      .attr("class", "y axis")
      .attr("transform", `translate(${this.opts.margin.left}, 0)`)
      .call(this.yAxis);
    this.markLimits();
  }
  
  

  private calcTicks(){
    return [60, 70,80, 90, 100, 110, 120, 140, 160, 180];
    let ticks=[];
    for(let i=this.opts.tickStart;i<=this.opts.tickEnd;i+=this.opts.tickInterval){
      ticks.push(i);
    }
    ticks=_([...ticks, this.opts.diasLimit, this.opts.sysLimit]).sortBy().uniq().value();
    return ticks;
  }

  private markLimits():void{
    let diasStroke=$(`.tick text:contains(${this.opts.diasLimit})`).parent().find("line");
    diasStroke.css("stroke-width", 3);
    diasStroke.css("stroke", "#009DFF");
    diasStroke.css("opacity", 0.5);
    
    let sysStroke=$(`.tick text:contains(${this.opts.sysLimit})`).parent().find("line");
    sysStroke.css("stroke-width", 3);
    sysStroke.css("stroke", "#016602");
    sysStroke.css("opacity", 0.5);
  }

  private updateAxes():void{
    this.svg.select(".x.axis").call(this.xAxis);
    this.svg.select(".y.axis").call(this.yAxis);
    
    this.xExtent=[_.first(this.data).timestamp, _.last(this.data).timestamp];
    
    this.brushScale.domain(this.xExtent)
      .range([0, this.opts.width]);
    d3.select("#brush-g").call(this.brushAxis);
    
  }
  /*
██      ██ ███    ██ ███████ ███████ 
██      ██ ████   ██ ██      ██      
██      ██ ██ ██  ██ █████   ███████ 
██      ██ ██  ██ ██ ██           ██ 
███████ ██ ██   ████ ███████ ███████ 
*/
  lineSys; lineDias; sysPath; diasPath;
  private setupLines():void{
    this.lineDias=d3.svg.line()
      .x((d,i)=>this.xScale(d.timestamp))
      .y((d,i)=>this.yScale(d.dias))
      .interpolate("cardinal");
    this.lineSys=d3.svg.line()
      .x((d,i)=>this.xScale(d.timestamp))
      .y((d,i)=>this.yScale(d.sys))
      .interpolate("cardinal");
      
    this.sysPath=this.svg.append("path")
      .datum(this.data)
      .attr("d", this.lineSys)
      .attr("clip-path", "url(#viewport-clip)")
      .attr("class", "widget line sys-line")
      .attr("stroke-width", "3px")
      .attr("fill", "none");
    this.diasPath=this.svg.append("path")
      .datum(this.data)
      .attr("d", this.lineDias)
      .attr("clip-path", "url(#viewport-clip)")
      .attr("class", "widget line dias-line")
      .attr("stroke-width", "3px")
      .attr("fill", "none");
  }
  private updateLines():void{
    this.sysPath
      .datum(this.data)
      .attr("d", this.lineSys);
    this.diasPath
      .datum(this.data)
      .attr("d", this.lineDias);
  }
  /*
██████   █████  ██████  
██   ██ ██   ██ ██   ██ 
██████  ███████ ██████  
██   ██ ██   ██ ██   ██ 
██████  ██   ██ ██   ██ 
*/
  bars;
  private setupBar():void{
    this.updateBar();
  }
  private updateBar():void{
    this.bars=this.svg.selectAll(".bar").data(this.data);
    
    //create
    this.bars
      .enter()
        .append("rect")
        .attr("clip-path", "url(#viewport-clip)");

    this.bars
      .attr("x", d=>(this.xScale(d.timestamp))-(this.opts.barSize/2))
      .attr("y", d=>this.yScale(d.pulse))
      .attr("width", this.opts.barSize)
      .attr("class", d=>`bar elem-${moment(d.timestamp).unix()}`)
      .attr("height", d=>this.opts.height-(this.yScale(d.pulse))-this.opts.margin.top-this.opts.margin.bottom);
    //exit
    this.bars.exit().remove();
  }
  
  private currentBarWidth():number{
    let firstCoord=this.xScale(moment().toDate());
    let secondCoord=this.xScale(moment().add(4, "hours").toDate());
    return secondCoord-firstCoord;
  }
  
  private reapplyBarWidth():void{
    this.opts.barSize=this.currentBarWidth();
    this.bars
      .attr("x", d=>(this.xScale(d.timestamp))-(this.opts.barSize/2))
      .attr("width", this.opts.barSize);
  }
  /*
 ██████ ██ ██████   ██████ ██      ███████ 
██      ██ ██   ██ ██      ██      ██      
██      ██ ██████  ██      ██      █████   
██      ██ ██   ██ ██      ██      ██      
 ██████ ██ ██   ██  ██████ ███████ ███████ 
*/
  sysCircle; diasCircle;
  private setupCircles():void{
    this.updateCircles();
  }
  
  private updateCircles():void{
    this.sysCircle=this.svg.selectAll(".sys-circle")
      .data(this.data);
    this.diasCircle=this.svg.selectAll(".dias-circle")
      .data(this.data);
    this.sysCircle
      .enter().append("circle")
        .attr("clip-path", "url(#viewport-clip)")
        .attr("cx", d=>this.xScale(d.timestamp))
        .attr("cy", d=>this.yScale(d.sys))
        .attr("r", this.opts.circleSize);
    this.diasCircle
      .enter().append("circle")
        .attr("clip-path", "url(#viewport-clip)")
        .attr("cx", d=>this.xScale(d.timestamp))
        .attr("cy", d=>this.yScale(d.sys))
        .attr("r", this.opts.circleSize);
    
    //update
    this.sysCircle
      .attr("class", d=>`circle sys-circle elem-${moment(d.timestamp).unix()}`)
      .attr("cx", d=>this.xScale(d.timestamp))
      .attr("cy", d=>this.yScale(d.sys));
    this.diasCircle
      .attr("class", d=>`circle dias-circle elem-${moment(d.timestamp).unix()}`)
      .attr("cx", d=>this.xScale(d.timestamp))
      .attr("cy", d=>this.yScale(d.dias));
      
    //remove
    this.sysCircle.exit().remove();
    this.diasCircle.exit().remove();
  }
  /*
██████  ██████  ██    ██ ███████ ██   ██ 
██   ██ ██   ██ ██    ██ ██      ██   ██ 
██████  ██████  ██    ██ ███████ ███████ 
██   ██ ██   ██ ██    ██      ██ ██   ██ 
██████  ██   ██  ██████  ███████ ██   ██ 
*/
  brushScale; timeBrush; brushSvg; brushAxis; brushElem;
  private setupBrush():void{
    this.brushScale=d3.time.scale().domain(this.xExtent).range([0, this.opts.width]);
    
    this.timeBrush=d3.svg.brush()
      .x(this.brushScale)
      .extent(this.xExtent)
      .on("brush", this.brushed.bind(this));
    this.brushSvg=d3.select("#brush")
      .append("svg")
      .attr("heigth", "100%")
      .attr("width", "100%");
      this.timeBrush.extent(this.initialExtent);
    let brushG=this.brushSvg.append("g")
      .attr("id", "brushG")
      .call(this.timeBrush)
      .selectAll("rect").attr("height", 50);
  }
  
  private brushed():void{
    this.xScale.domain(this.timeBrush.extent());
    this.xAxisElem.call(this.xAxis);
    
    this.bars
      .attr("x", d=>this.xScale(d.timestamp)-(this.opts.barSize/2));
    
    this.reapplyBarWidth();
    
    this.diasCircle
      .attr("cx", d=>this.xScale(d.timestamp));

    this.sysCircle
      .attr("cx", d=>this.xScale(d.timestamp));
      
    this.sysPath.attr("d", this.lineSys);
    this.diasPath.attr("d", this.lineDias);
    
    this.overlaySysPath.attr("d", this.lineSys);
    this.overlayDiasPath.attr("d", this.lineDias);
  }
  /*
████████  ██████   ██████  ██   ████████ ██ ██████  
   ██    ██    ██ ██    ██ ██      ██    ██ ██   ██ 
   ██    ██    ██ ██    ██ ██      ██    ██ ██████  
   ██    ██    ██ ██    ██ ██      ██    ██ ██      
   ██     ██████   ██████  ███████ ██    ██ ██      
*/
  private setupTooltips():void{
    this.svg.selectAll("circle.sys-circle")
      .on("mouseover", (d)=>{
        this.displayTooltip(d, "sys", d3.event);
      });
      
    this.svg.selectAll("circle.dias-circle")
      .on("mouseover", (d)=>{
        this.displayTooltip(d, "dias", d3.event);
      });
    this.svg.selectAll("rect.bar")
      .on("mouseover", (d)=>{
        this.displayTooltip(d, "pulse", d3.event);
      });
    this.svg.selectAll("circle")
      .on("mouseout", d=>this.removeTooltip(d));
    this.svg.selectAll("rect")
      .on("mouseout", d=>this.removeTooltip(d));
  }
  
  private removeTooltip(d){
    d3.selectAll(`.elem-${moment(d.timestamp).unix()}`).classed("highlighted-tooltip", false);
    this.svg.selectAll('.desc').remove();
    this.svg.selectAll(`.circle.elem-${moment(d.timestamp).unix()}`)
      .attr("r", this.opts.circleSize);
  }
  
  private  displayTooltip(d, chartType, event):void{
    let startX, startY;
    
    this.svg.selectAll(`.elem-${moment(d.timestamp).unix()}`).classed("highlighted-tooltip", true);
    this.svg.selectAll(`.circle.elem-${moment(d.timestamp).unix()}`)
      .attr("r", this.opts.circleSize*2);
    
    if(event.pageX+130<this.opts.width){
      startX=this.xScale(d.timestamp);
      startY=this.yScale(_.get(d, chartType));
    } else{
      startX=this.xScale(d.timestamp)-150;
      startY=this.yScale(_.get(d, chartType));
    }
    this.svg.select('.desc').remove();
    this.svg
      .append("rect")
      .attr("class", "desc-rect desc")
      .attr("id", `desc-${d.id}`)
      .attr("x", startX+5)
      .attr("y", this.yScale(_.get(d, chartType))+6)
      .attr("height", 70)
      .attr("width", 130);
    
    this.svg
      .append("text")
      .attr("x", startX+10)
      .attr("y", this.yScale(_.get(d, chartType))+20)
      .attr("class", "desc tooltip-value")
      .text(moment(d.timestamp).format("MMM DD HH:mm"));
    this.svg
      .append("text")
      .attr("class", "desc")
      .attr("x", startX+10)
      .attr("y", this.yScale(_.get(d, chartType))+35)
      .text("Sys: ")
      .append("tspan")
        .attr("class", "tooltip-value")
        .text(d.sys);
    this.svg
      .append("text")
      .attr("class", "desc")
      .attr("x", startX+10)
      .attr("y", this.yScale(_.get(d, chartType))+50)
      .text("Dias: ")
      .append("tspan")
        .attr("class", "tooltip-value")
        .text(d.dias);
            
    this.svg
      .append("text")
      .attr("class", "desc")
      .attr("x", startX+10)
      .attr("y", this.yScale(_.get(d, chartType))+65)
      .text("Pulse: ")
      .append("tspan")
        .attr("class", "tooltip-value")
        .text(d.pulse);
    
  }
  /*
 ██████ ██      ██ ██████  
██      ██      ██ ██   ██ 
██      ██      ██ ██████  
██      ██      ██ ██      
 ██████ ███████ ██ ██      
*/
  private setupClips():void{
    var diasClip=this.svg.append("clipPath")
      .attr("id", "dias-clip");

    diasClip.append("rect")
        .attr("x",this.opts.margin.left)
        .attr("y", 0)
        .attr("height", this.yScale(this.opts.diasLimit))
        .attr("width", this.opts.width);
    
    var sysClip=this.svg.append("clipPath")
      .attr("id", "sys-clip");
    
    sysClip.append("rect")
        .attr("x",this.opts.margin.left)
        .attr("y", 0)
        .attr("height", this.yScale(this.opts.sysLimit))
        .attr("width", this.opts.width);
  }
  
  private setupViewboardClip():void{
    this.svg.append("clipPath")
      .attr("id", "viewport-clip")
      .append("rect")
        .attr("x", this.opts.margin.left)
        .attr("y", this.opts.margin.top)
        .attr("height", this.opts.height)
        .attr("width", this.opts.width);
  }
/*
 ██████  ██    ██ ███████ ██████  ██       █████  ██    ██     ██      ██ ███    ██ ███████ 
██    ██ ██    ██ ██      ██   ██ ██      ██   ██  ██  ██      ██      ██ ████   ██ ██      
██    ██ ██    ██ █████   ██████  ██      ███████   ████       ██      ██ ██ ██  ██ █████   
██    ██  ██  ██  ██      ██   ██ ██      ██   ██    ██        ██      ██ ██  ██ ██ ██      
 ██████    ████   ███████ ██   ██ ███████ ██   ██    ██        ███████ ██ ██   ████ ███████ 
*/
  overlayDiasPath; overlaySysPath;
  overlayLineDias; overlayLineSys;
  private setupOverlayLines():void{
    this.overlayLineDias=d3.svg.line()
      .x((d,i)=>this.xScale(d.timestamp))
      .y((d,i)=>this.yScale(d.dias))
      .interpolate("cardinal");

    this.overlayDiasPath=this.svg.append("path")
      .datum(this.data)
      .attr("clip-path", "url(#dias-clip)")
      .attr("class", "widget overlay-line overlay-dias-line")
      .attr("fill", "none");

    this.overlayLineSys=d3.svg.line()
      .x((d,i)=>this.xScale(d.timestamp))
      .y((d,i)=>this.yScale(d.sys))
      .interpolate("cardinal");
      
    this.overlaySysPath=this.svg.append("path")
      .datum(this.data)
      .attr("clip-path", "url(#sys-clip)")
      .attr("class", "widget overlay-line overlay-sys-line")
      .attr("fill", "none");

    this.updateOverlayLines();
  }

  private updateOverlayLines():void{
    this.overlaySysPath
      .datum(this.data)
      .attr("d", this.overlayLineSys);

    this.overlayDiasPath
      .datum(this.data)
      .attr("d", this.overlayLineDias);
  }
/*
██████  ██████  ██    ██ ███████ ██   ██      █████  ██   ██ ███████ ███████ 
██   ██ ██   ██ ██    ██ ██      ██   ██     ██   ██  ██ ██  ██      ██      
██████  ██████  ██    ██ ███████ ███████     ███████   ███   █████   ███████ 
██   ██ ██   ██ ██    ██      ██ ██   ██     ██   ██  ██ ██  ██           ██ 
██████  ██   ██  ██████  ███████ ██   ██     ██   ██ ██   ██ ███████ ███████ 
*/
  private setupBrushAxes():void{
    this.brushAxis=d3.svg.axis()
      .scale(this.brushScale)
      .orient("bottom");
    this.brushElem=this.brushSvg.append("g")
      .attr("id", "brush-g")
      .call(this.brushAxis);
  }
  
  private setupChart():void{
    this.svg=d3.select(this.selector)
      .attr("width", this.opts.width)
      .attr("height", this.opts.height);
  }
}

/*
let mc=new MedChart(data, ".chart", "b");
function changeData(){
  mc.update([...mc.data, {
    pulse: _.random(10, 50),
    sys: _.random(10, 50),
    dias: _.random(10, 50),
    timestamp: moment(_.last(mc.data).timestamp).add(4, "hours").toDate()
  }]);
}
*/