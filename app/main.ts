import {bootstrap} from 'angular2/platform/browser';
import AppComp from './AppComp';
import {HTTP_PROVIDERS} from 'angular2/http';
import ReadingService from './ReadingService';

bootstrap(AppComp, [HTTP_PROVIDERS, ReadingService]);

