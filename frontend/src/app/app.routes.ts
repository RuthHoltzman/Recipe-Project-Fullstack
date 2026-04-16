import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SearchComponent } from './components/search/search.component';
import { RecipeDetailComponent } from './components/recipe-detail/recipe-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { authGuard ,adminGuard} from './guards/auth.guard';
import { AddRecipeComponent } from './components/add-recipe/add-recipe.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AllRecipesComponent } from './components/all-recipes/all-recipes.component';
import { MyBookComponent } from './components/my-book/my-book.component';
import { ShoppingListComponent } from './components/shopping-list/shopping-list.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // ניתוב ברירת מחדל לדף הבית
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'all-recipes', component: AllRecipesComponent },
  { path: 'shopping-list', component: ShoppingListComponent, canActivate: [authGuard] },
  { path: 'my-book', component: MyBookComponent, canActivate: [authGuard] },
  { path: 'search', component: SearchComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'add-recipe', component: AddRecipeComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'register', component: RegisterComponent },
  { path: 'recipe/:id', component: RecipeDetailComponent } ,// דף מתכון עם פרמטר ID
  { path: '**', component: NotFoundComponent }
];
