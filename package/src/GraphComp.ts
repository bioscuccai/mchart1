declare var data:[any];

import {Component, Input} from 'angular2/core';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import MedChart from './chart';

@Component({
  selector: "graph-graph",
  template: `
    <div>
      <div>
        <svg class="chart"></svg>
      </div>
      <div id="brush"></div>
    </div>`,
  host: {
    'id': 'id'
  }
})
export default class GraphComp{
  id: string="chart-id";
  mc:any;
  @Input() data=[];
  @Input() opts={};
  constructor(){
    this.id=uuid.v4();
  }
  
  ngAfterContentInit(){

  }
  
  ngOnChanges(){
    console.log("changed from graph");
    if(this.mc){
      console.log("updating");
      this.mc.update(this.data);
    } else {
      if(this.data.length!=0){
        this.mc=new MedChart(this.data, `.chart`, '#brush', this.opts);
      }
    }
  }
}
