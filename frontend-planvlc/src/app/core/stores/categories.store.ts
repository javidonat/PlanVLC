import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';
import { EntityStore } from './entity.store';

// Estado compartido de las categorías (ver EntityStore)
@Injectable({ providedIn: 'root' })
export class CategoriesStore extends EntityStore<Category> {}
