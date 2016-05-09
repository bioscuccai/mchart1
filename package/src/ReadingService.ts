//minden adat kulon tombben ahogy a scv1.rb generalja, igy kisebb amikor kikerul Codepen-re
//a data.js-bol jon globaliskent amit az app.html huz be
declare var timestampFlat;
declare var pulseFlat;
declare var sysFlat;
declare var diasFlat;

import * as moment from 'moment';
import {Injectable, bind} from 'angular2/core';
import {Http} from  'angular2/http';
import * as Rx from 'rxjs';
import * as _ from 'lodash';
import * as Promise from 'bluebird';


@Injectable()
export default class ReadingService{
  //debughoz, az osszes adat benne van, gyakorlatban a queryRange-t kellene hasznalni
  dataStream:any;
  data;
  constructor(public http: Http){
    this.data=_.zip(pulseFlat, sysFlat, diasFlat, timestampFlat).map(e=>{
      return {
        pulse: e[0],
        sys: e[1],
        dias: e[2],
        timestamp: new Date(e[3]*1000)
      };
    });
    this.dataStream=new Rx.BehaviorSubject(this.data);
  }
  
  private processData(original){
    return original;
  }
  
  setSource(){
    
  }
  
  //perpill nincs hasznalva, de ha a GraphComp figyeli akkor valtozik a megelenitese is
  append(newData):void{
    _.assign(newData, {
      timestamp: moment(_.last(this.dataStream.getValue()).timestamp).add(4, "hours").toDate()
    });
    console.log("new data:");
    console.log(newData);
    this.dataStream.next([...this.dataStream.getValue(), newData]);
  }
  
  
  //mock: a szerveren levo intervallum
  dateRange(){
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
