import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BundleService {

  constructor(private http: HttpClient) { }

  getByUrl(url: string) {
    return this.http.get(url);
  }

}
