import {Component} from 'angular2/core';
import GraphComp from './GraphComp';
import FormComp from './FormComp';
import GraphPaginatorComp from './GraphPaginatorComp';
import ReadingService from './ReadingService';

@Component({
  selector: 'graph-app',
  directives: [GraphComp, FormComp, GraphPaginatorComp],
  template: `<div>
    <div>
      <graph-paginator></graph-paginator>
    </div>
    <!--<div>
      <graph-form></graph-form>
    </div>-->
  </div>`
})
export default class AppComp{
  constructor(public readingService:ReadingService){
  }
}
