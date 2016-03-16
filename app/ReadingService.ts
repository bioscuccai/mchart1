declare var data:[any];

import * as moment from 'moment';
import {Injectable, bind} from 'angular2/core';
import {Http} from  'angular2/http';
import * as Rx from 'rxjs';
import * as _ from 'lodash';

@Injectable()
export default class ReadingService{
  dataStream:any;
  
  constructor(public http: Http){
    console.log("creating service "+_.uniqueId());
    this.dataStream=new Rx.BehaviorSubject(data);
  }
  
  load(){
    return data;
  }
  
  append(newData):void{
    _.assign(newData, {
      timestamp: moment(_.last(this.dataStream.getValue()).timestamp).add(4, "hours").toDate()
    });
    console.log("new data:");
    console.log(newData);
    this.dataStream.next([...this.dataStream.getValue(), newData]);
  }
}
