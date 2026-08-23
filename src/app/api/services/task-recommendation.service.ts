import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, map} from 'rxjs';
import API_URL from 'src/app/config/constants/apiUrl';

export type TaskRecommendation = {
  task_id: number | null;
  task_definition_id: number;
  task_name: string;
  project_id: number;
  unit_id: number;
  priority_score: number;
};

type TaskRecommendationResponse = {
  data: TaskRecommendation[];
  meta: {
    total_count: number;
  };
};

@Injectable({providedIn: 'root'})
export class TaskRecommendationService {
  constructor(private httpClient: HttpClient) {}

  getAll(): Observable<TaskRecommendation[]> {
    return this.httpClient
      .get<TaskRecommendationResponse>(`${API_URL}/tasks/recommended`)
      .pipe(map((response) => response.data));
  }
}
