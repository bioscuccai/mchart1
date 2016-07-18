var app=angular.module("app", []);

app.controller("AppCtrl", function($scope){
  
});

app.service("PaginatorFactory", function(){
  //ez dolgozza fel a mock adatokat (4 tomb a data.js-bol => 1 tomb)
  var currentData=_.zip(pulseFlat, sysFlat, diasFlat, timestampFlat)
    .map(e=>{
      return {
          pulse: e[0],
          sys: e[1],
          dias: e[2],
          timestamp: new Date(e[3]*1000)
        };
  });
  
  function dateRange(){
    return new Promise((resolve, reject)=>{
      return resolve({
        start: _.first(currentData).timestamp,
        end: _.last(currentData).timestamp
      });
    });
  }
  
  function queryRange(start, stop){
    return new Promise((resolve, reject)=>{
      return resolve(currentData.filter(item=>(item.timestamp>=start && item.timestamp<=stop)));
    });
  }
  
  return {
    dateRange: dateRange,
    queryRange: queryRange
  };
});

app.directive("chartPaginator", function($timeout, PaginatorFactory){
  return {
    link: function(scope, element, attrs){
      scope.chartId=_.uniqueId();
      scope.week=1; //kezdeti intervallum hany hetet vonjon ki
      scope.currentData=[]; //ezt adja at a standalone graphnak
      
      scope.currentRangeAsDate={};
      scope.range={};
      
      PaginatorFactory.dateRange()
      .then((range=>{
        var initialRange=[Math.max(moment(range.start), moment(range.end).subtract(scope.week, 'weeks')), range.end.getTime()];
        scope.$apply(function(){
          _.assign(scope.range, {
            start: new Date(range.start),
            end: new Date(range.end)
          });
        });
        scope.slider=$(".slider").slider({
          range: true,
          min: range.start.getTime(),
          max: range.end.getTime(),
          values: initialRange,
          stop: sliderChanged.bind(this),
          step: 1000*60*60*24 //1 nap
        });
        
        sliderChanged();
      }))
      .catch(e=>{
        console.log(e);
      });
      
      function sliderChanged(){
        var range=scope.slider.slider("values");
        
        PaginatorFactory.queryRange(new Date(range[0]), new Date(range[1]))
        .then(readings=>{
          scope.$apply(()=>{
            _.assign(scope.currentRange, {
              start: range[0],
              end: range[1]
            });
            _.assign(scope.currentRangeAsDate, {
              start: new Date(range[0]),
              end: new Date(range[1])
            });
            
            scope.currentData=readings;
          });
        })
        .catch(e=>{
          console.log(e);
        });
      }
    },
    templateUrl: "chart/templates/chart_paginator.html"
  };
});

app.directive("chartChart", function($timeout){
  return {
    scope: {
      data: "="
    },
    link: function(scope, element, attrs){
      scope.mc=null;
      $timeout(function(){
        
        var dataWatcher=scope.$watch('data', function(newVal, oldVal){
          if(scope.mc===null && scope.data.length!==0){ //ures bemenetre a chart felkeszitve
            scope.mc=new MedChart(scope.data, ".chart", "#brush");
          }
          if(scope.mc!==null && scope.data.length!==0){
            scope.mc.update(scope.data);
          }
        });
        
        scope.$on("$destroy", function(){
          dataWatcher();
        });
        
      });
    },
    templateUrl: 'chart/templates/chart.html'
  };
});
