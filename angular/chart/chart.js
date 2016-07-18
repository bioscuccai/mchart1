//declare var data:[any];
/*
import * as _ from 'lodash';
var d3=require("d3/d3.min");
var moment=require('moment');
var $=require('jquery');
*/
/*var data=_.zip(pulseFlat, sysFlat, diasFlat, timestampFlat).map(e=>{
  return {
    pulse: e[0],
    sys: e[1],
    dias: e[2],
    timestamp: new Date(e[3]*1000)
  };
});*/
if (_.isUndefined(d3.selection.prototype.moveToFront)) {
    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };
}
var MedChart = (function () {
    function MedChart(data, selector, brushSelector, opts) {
        if (opts === void 0) { opts = {}; }
        this.data = data;
        this.selector = selector;
        this.brushSelector = brushSelector;
        this.opts = opts;
        //class MedChart{
        this.defaults = {
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
            limit: 200,
            range: 72
        };
        _.defaultsDeep(this.opts, this.defaults);
        this.data = this.parseData(data);
        this.setup();
    }
    MedChart.prototype.update = function (data) {
        this.data = this.parseData(data);
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
    };
    MedChart.prototype.parseData = function (data) {
        return _(data).map(function (d) {
            return _.assign({}, d, {
                timestamp: _.isDate(d.timestamp) ? d.timestamp : moment(d.timestamp).toDate()
            });
        }).takeRight(this.opts.limit).value();
    };
    MedChart.prototype.setup = function () {
        this.setupChart();
        this.setupScales();
        this.opts.barSize = this.currentBarWidth();
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
    };
    MedChart.prototype.setupScales = function () {
        this.initialExtent = [
            moment(_.last(this.data).timestamp).subtract(this.opts.range, "hours").toDate(),
            _.last(this.data).timestamp
        ];
        this.xExtent = [_.first(this.data).timestamp, _.last(this.data).timestamp];
        this.xScale = d3.time.scale()
            .domain(this.initialExtent)
            .range([this.opts.margin.left, this.opts.width - this.opts.margin.right]);
        this.yScale = d3.scale.linear()
            .domain([this.opts.tickStart, Math.max(d3.max(this.data, function (d) { return d.pulse; }), this.opts.tickEnd)])
            .range([this.opts.height - this.opts.margin.top - this.opts.margin.bottom, this.opts.margin.top]);
        this.brushScale = d3.time.scale()
            .domain(this.xExtent)
            .range([0, this.opts.width]);
    };
    MedChart.prototype.setupAxes = function () {
        this.tickFormat = d3.time.format.multi([
            ["%b %d", function (d) { return d.getHours() === 0; }],
            ["%H:%M", function (d) { return true; }],
            ["%a %d", function (d) { return d.getDay() && d.getDate() != 1; }],
            ["%b %d", function (d) { return d.getDate() != 1; }],
            ["%b", function (d) { return d.getMonth(); }],
            ["%Y", function () { return true; }]
        ]);
        this.xAxis = d3.svg.axis()
            .scale(this.xScale)
            .tickSize(3)
            .innerTickSize(-this.opts.width)
            .tickFormat(this.tickFormat)
            .orient("bottom");
        this.yAxis = d3.svg.axis()
            .tickValues(this.calcTicks())
            .scale(this.yScale)
            .tickSize(3)
            .innerTickSize(-this.opts.width)
            .orient("left");
        this.xAxisElem = this.svg
            .append("g")
            .attr("transform", "translate(0, " + (this.opts.height - this.opts.margin.top - this.opts.margin.bottom) + ")")
            .attr("class", "x axis")
            .call(this.xAxis);
        this.yAxisElem = this.svg
            .append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + this.opts.margin.left + ", 0)")
            .call(this.yAxis);
        this.markLimits();
    };
    MedChart.prototype.calcTicks = function () {
        return [60, 70, 80, 90, 100, 110, 120, 140, 160, 180];
        var ticks = [];
        for (var i = this.opts.tickStart; i <= this.opts.tickEnd; i += this.opts.tickInterval) {
            ticks.push(i);
        }
        ticks = _(ticks.concat([this.opts.diasLimit, this.opts.sysLimit])).sortBy().uniq().value();
        return ticks;
    };
    MedChart.prototype.markLimits = function () {
        var diasStroke = $(".tick text:contains(" + this.opts.diasLimit + ")").parent().find("line");
        diasStroke.css("stroke-width", 3);
        diasStroke.css("stroke", "#009DFF");
        diasStroke.css("opacity", 0.5);
        var sysStroke = $(".tick text:contains(" + this.opts.sysLimit + ")").parent().find("line");
        sysStroke.css("stroke-width", 3);
        sysStroke.css("stroke", "#016602");
        sysStroke.css("opacity", 0.5);
    };
    MedChart.prototype.updateAxes = function () {
        this.svg.select(".x.axis").call(this.xAxis);
        this.svg.select(".y.axis").call(this.yAxis);
        this.xExtent = [_.first(this.data).timestamp, _.last(this.data).timestamp];
        this.brushScale.domain(this.xExtent)
            .range([0, this.opts.width]);
        d3.select("#brush-g").call(this.brushAxis);
    };
    MedChart.prototype.setupLines = function () {
        var _this = this;
        this.lineDias = d3.svg.line()
            .x(function (d, i) { return _this.xScale(d.timestamp); })
            .y(function (d, i) { return _this.yScale(d.dias); })
            .interpolate("cardinal");
        this.lineSys = d3.svg.line()
            .x(function (d, i) { return _this.xScale(d.timestamp); })
            .y(function (d, i) { return _this.yScale(d.sys); })
            .interpolate("cardinal");
        this.sysPath = this.svg.append("path")
            .datum(this.data)
            .attr("d", this.lineSys)
            .attr("clip-path", "url(#viewport-clip)")
            .attr("class", "widget line sys-line")
            .attr("stroke-width", "3px")
            .attr("fill", "none");
        this.diasPath = this.svg.append("path")
            .datum(this.data)
            .attr("d", this.lineDias)
            .attr("clip-path", "url(#viewport-clip)")
            .attr("class", "widget line dias-line")
            .attr("stroke-width", "3px")
            .attr("fill", "none");
    };
    MedChart.prototype.updateLines = function () {
        this.sysPath
            .datum(this.data)
            .attr("d", this.lineSys);
        this.diasPath
            .datum(this.data)
            .attr("d", this.lineDias);
    };
    MedChart.prototype.setupBar = function () {
        this.updateBar();
    };
    MedChart.prototype.updateBar = function () {
        var _this = this;
        this.bars = this.svg.selectAll(".bar").data(this.data);
        //create
        this.bars
            .enter()
            .append("rect")
            .attr("clip-path", "url(#viewport-clip)");
        this.bars
            .attr("x", function (d) { return (_this.xScale(d.timestamp)) - (_this.opts.barSize / 2); })
            .attr("y", function (d) { return _this.yScale(d.pulse); })
            .attr("width", this.opts.barSize)
            .attr("class", function (d) { return ("bar elem-" + moment(d.timestamp).unix()); })
            .attr("height", function (d) { return _this.opts.height - (_this.yScale(d.pulse)) - _this.opts.margin.top - _this.opts.margin.bottom; });
        //exit
        this.bars.exit().remove();
    };
    MedChart.prototype.currentBarWidth = function () {
        var firstCoord = this.xScale(moment().toDate());
        var secondCoord = this.xScale(moment().add(4, "hours").toDate());
        return secondCoord - firstCoord;
    };
    MedChart.prototype.reapplyBarWidth = function () {
        var _this = this;
        this.opts.barSize = this.currentBarWidth();
        this.bars
            .attr("x", function (d) { return (_this.xScale(d.timestamp)) - (_this.opts.barSize / 2); })
            .attr("width", this.opts.barSize);
    };
    MedChart.prototype.setupCircles = function () {
        this.updateCircles();
    };
    MedChart.prototype.updateCircles = function () {
        var _this = this;
        this.sysCircle = this.svg.selectAll(".sys-circle")
            .data(this.data);
        this.diasCircle = this.svg.selectAll(".dias-circle")
            .data(this.data);
        this.sysCircle
            .enter().append("circle")
            .attr("clip-path", "url(#viewport-clip)")
            .attr("cx", function (d) { return _this.xScale(d.timestamp); })
            .attr("cy", function (d) { return _this.yScale(d.sys); })
            .attr("r", this.opts.circleSize);
        this.diasCircle
            .enter().append("circle")
            .attr("clip-path", "url(#viewport-clip)")
            .attr("cx", function (d) { return _this.xScale(d.timestamp); })
            .attr("cy", function (d) { return _this.yScale(d.sys); })
            .attr("r", this.opts.circleSize);
        //update
        this.sysCircle
            .attr("class", function (d) { return ("circle sys-circle elem-" + moment(d.timestamp).unix()); })
            .attr("cx", function (d) { return _this.xScale(d.timestamp); })
            .attr("cy", function (d) { return _this.yScale(d.sys); });
        this.diasCircle
            .attr("class", function (d) { return ("circle dias-circle elem-" + moment(d.timestamp).unix()); })
            .attr("cx", function (d) { return _this.xScale(d.timestamp); })
            .attr("cy", function (d) { return _this.yScale(d.dias); });
        //remove
        this.sysCircle.exit().remove();
        this.diasCircle.exit().remove();
    };
    MedChart.prototype.setupBrush = function () {
        this.brushScale = d3.time.scale().domain(this.xExtent).range([0, this.opts.width]);
        this.timeBrush = d3.svg.brush()
            .x(this.brushScale)
            .extent(this.xExtent)
            .on("brush", this.brushed.bind(this));
        this.brushSvg = d3.select("#brush")
            .append("svg")
            .attr("heigth", "100%")
            .attr("width", "100%");
        this.timeBrush.extent(this.initialExtent);
        var brushG = this.brushSvg.append("g")
            .attr("id", "brushG")
            .call(this.timeBrush)
            .selectAll("rect").attr("height", 50);
    };
    MedChart.prototype.brushed = function () {
        var _this = this;
        this.xScale.domain(this.timeBrush.extent());
        this.xAxisElem.call(this.xAxis);
        this.bars
            .attr("x", function (d) { return _this.xScale(d.timestamp) - (_this.opts.barSize / 2); });
        this.reapplyBarWidth();
        this.diasCircle
            .attr("cx", function (d) { return _this.xScale(d.timestamp); });
        this.sysCircle
            .attr("cx", function (d) { return _this.xScale(d.timestamp); });
        this.sysPath.attr("d", this.lineSys);
        this.diasPath.attr("d", this.lineDias);
        this.overlaySysPath.attr("d", this.lineSys);
        this.overlayDiasPath.attr("d", this.lineDias);
    };
    /*
  ████████  ██████   ██████  ██   ████████ ██ ██████
     ██    ██    ██ ██    ██ ██      ██    ██ ██   ██
     ██    ██    ██ ██    ██ ██      ██    ██ ██████
     ██    ██    ██ ██    ██ ██      ██    ██ ██
     ██     ██████   ██████  ███████ ██    ██ ██
  */
    MedChart.prototype.setupTooltips = function () {
        var _this = this;
        this.svg.selectAll("circle.sys-circle")
            .on("mouseover", function (d) {
            _this.displayTooltip(d, "sys", d3.event);
        });
        this.svg.selectAll("circle.dias-circle")
            .on("mouseover", function (d) {
            _this.displayTooltip(d, "dias", d3.event);
        });
        this.svg.selectAll("rect.bar")
            .on("mouseover", function (d) {
            _this.displayTooltip(d, "pulse", d3.event);
        });
        this.svg.selectAll("circle")
            .on("mouseout", function (d) { return _this.removeTooltip(d); });
        this.svg.selectAll("rect")
            .on("mouseout", function (d) { return _this.removeTooltip(d); });
    };
    MedChart.prototype.removeTooltip = function (d) {
        d3.selectAll(".elem-" + moment(d.timestamp).unix()).classed("highlighted-tooltip", false);
        this.svg.selectAll('.desc').remove();
        this.svg.selectAll(".circle.elem-" + moment(d.timestamp).unix())
            .attr("r", this.opts.circleSize);
    };
    MedChart.prototype.displayTooltip = function (d, chartType, event) {
        var startX, startY;
        this.svg.selectAll(".elem-" + moment(d.timestamp).unix()).classed("highlighted-tooltip", true);
        this.svg.selectAll(".circle.elem-" + moment(d.timestamp).unix())
            .attr("r", this.opts.circleSize * 2);
        if (event.pageX + 130 < this.opts.width) {
            startX = this.xScale(d.timestamp);
            startY = this.yScale(_.get(d, chartType));
        }
        else {
            startX = this.xScale(d.timestamp) - 150;
            startY = this.yScale(_.get(d, chartType));
        }
        this.svg.select('.desc').remove();
        this.svg
            .append("rect")
            .attr("class", "desc-rect desc")
            .attr("id", "desc-" + d.id)
            .attr("x", startX + 5)
            .attr("y", this.yScale(_.get(d, chartType)) + 6)
            .attr("height", 70)
            .attr("width", 130);
        this.svg
            .append("text")
            .attr("x", startX + 10)
            .attr("y", this.yScale(_.get(d, chartType)) + 20)
            .attr("class", "desc tooltip-value")
            .text(moment(d.timestamp).format("MMM DD HH:mm"));
        this.svg
            .append("text")
            .attr("class", "desc")
            .attr("x", startX + 10)
            .attr("y", this.yScale(_.get(d, chartType)) + 35)
            .text("Sys: ")
            .append("tspan")
            .attr("class", "tooltip-value")
            .text(d.sys);
        this.svg
            .append("text")
            .attr("class", "desc")
            .attr("x", startX + 10)
            .attr("y", this.yScale(_.get(d, chartType)) + 50)
            .text("Dias: ")
            .append("tspan")
            .attr("class", "tooltip-value")
            .text(d.dias);
        this.svg
            .append("text")
            .attr("class", "desc")
            .attr("x", startX + 10)
            .attr("y", this.yScale(_.get(d, chartType)) + 65)
            .text("Pulse: ")
            .append("tspan")
            .attr("class", "tooltip-value")
            .text(d.pulse);
    };
    /*
   ██████ ██      ██ ██████
  ██      ██      ██ ██   ██
  ██      ██      ██ ██████
  ██      ██      ██ ██
   ██████ ███████ ██ ██
  */
    MedChart.prototype.setupClips = function () {
        var diasClip = this.svg.append("clipPath")
            .attr("id", "dias-clip");
        diasClip.append("rect")
            .attr("x", this.opts.margin.left)
            .attr("y", 0)
            .attr("height", this.yScale(this.opts.diasLimit))
            .attr("width", this.opts.width);
        var sysClip = this.svg.append("clipPath")
            .attr("id", "sys-clip");
        sysClip.append("rect")
            .attr("x", this.opts.margin.left)
            .attr("y", 0)
            .attr("height", this.yScale(this.opts.sysLimit))
            .attr("width", this.opts.width);
    };
    MedChart.prototype.setupViewboardClip = function () {
        this.svg.append("clipPath")
            .attr("id", "viewport-clip")
            .append("rect")
            .attr("x", this.opts.margin.left)
            .attr("y", this.opts.margin.top)
            .attr("height", this.opts.height)
            .attr("width", this.opts.width);
    };
    MedChart.prototype.setupOverlayLines = function () {
        var _this = this;
        this.overlayLineDias = d3.svg.line()
            .x(function (d, i) { return _this.xScale(d.timestamp); })
            .y(function (d, i) { return _this.yScale(d.dias); })
            .interpolate("cardinal");
        this.overlayDiasPath = this.svg.append("path")
            .datum(this.data)
            .attr("clip-path", "url(#dias-clip)")
            .attr("class", "widget overlay-line overlay-dias-line")
            .attr("fill", "none");
        this.overlayLineSys = d3.svg.line()
            .x(function (d, i) { return _this.xScale(d.timestamp); })
            .y(function (d, i) { return _this.yScale(d.sys); })
            .interpolate("cardinal");
        this.overlaySysPath = this.svg.append("path")
            .datum(this.data)
            .attr("clip-path", "url(#sys-clip)")
            .attr("class", "widget overlay-line overlay-sys-line")
            .attr("fill", "none");
        this.updateOverlayLines();
    };
    MedChart.prototype.updateOverlayLines = function () {
        this.overlaySysPath
            .datum(this.data)
            .attr("d", this.overlayLineSys);
        this.overlayDiasPath
            .datum(this.data)
            .attr("d", this.overlayLineDias);
    };
    /*
    ██████  ██████  ██    ██ ███████ ██   ██      █████  ██   ██ ███████ ███████
    ██   ██ ██   ██ ██    ██ ██      ██   ██     ██   ██  ██ ██  ██      ██
    ██████  ██████  ██    ██ ███████ ███████     ███████   ███   █████   ███████
    ██   ██ ██   ██ ██    ██      ██ ██   ██     ██   ██  ██ ██  ██           ██
    ██████  ██   ██  ██████  ███████ ██   ██     ██   ██ ██   ██ ███████ ███████
    */
    MedChart.prototype.setupBrushAxes = function () {
        this.brushAxis = d3.svg.axis()
            .scale(this.brushScale)
            .tickFormat(d3.time.format("%b %d"))
            .orient("bottom");
        this.brushElem = this.brushSvg.append("g")
            .attr("id", "brush-g")
            .call(this.brushAxis);
    };
    MedChart.prototype.setupChart = function () {
        this.svg = d3.select(this.selector)
            .attr("width", this.opts.width)
            .attr("height", this.opts.height);
    };
    return MedChart;
})();
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
