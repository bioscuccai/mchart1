import * as moment from 'moment';
import {Injectable, bind} from 'angular2/core';
import * as _ from 'lodash';
import * as Promise from 'bluebird';


@Injectable()
export default class ReadingService{
  //debughoz, az osszes adat benne van, gyakorlatban a queryRange-t kellene hasznalni
  dataStream:any;
  data=[];
  
  pulseFlat; sysFlat; diasFlat; timestampFlat;
  
  constructor(){
    
  }
  
  private processData(original){
    return original;
  }
  
  setSource(...rest){
    console.log("source");
    console.log(rest);
    [this.pulseFlat, this.sysFlat, this.diasFlat, this.timestampFlat]=rest;
    this.data=_.zip(this.pulseFlat, this.sysFlat, this.diasFlat, this.timestampFlat).map(e=>{
      return {
        pulse: e[0],
        sys: e[1],
        dias: e[2],
        timestamp: new Date(e[3]*1000)
      };
    });
  }
  
  //mock: a szerveren levo intervallum
  dateRange(){
    console.log("range");
    return new Promise((resolve, reject)=>{
      return resolve({
        start: _.first(this.data).timestamp,
        end: _.last(this.data).timestamp
      });
    });
  }
  
  //mock: az adot intervallumba tartozo observationok
  queryRange(start, stop){
    return new Promise((resolve, reject)=>{
      return resolve(this.data.filter(item=>(item.timestamp>=start && item.timestamp<=stop)));
    });
  }
}
