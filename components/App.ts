import {Component} from 'angular2/core';
import GraphPaginatorComp from '../medchart/GraphPaginatorComp';
import data from "../data";
import ReadingService from '../medchart/ReadingService';

@Component({
  selector: 'graph-app',
  directives: [GraphPaginatorComp],
  template: `<div>
    <div>
      <graph-paginator></graph-paginator>
    </div>
  </div>`
})
export default class AppComp{
  constructor(public readingService:ReadingService){
    this.readingService.setSource(data.pulseFlat, data.sysFlat, data.diasFlat, data.timestampFlat);
  }
}
