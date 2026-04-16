import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // הוספנו ChangeDetectorRef
import { RecipeService } from '../../services/recipe.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-search',
  imports: [FormsModule, RouterModule, CommonModule],
  standalone: true,
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {
  
  userIngredients: Array<string> = ['']; 
  matchingRecipes: Array<any> = new Array<any>();
  isListening = false; // משתנה למצב המיקרופון

  apiUrl: string = environment.apiUrl;
  constructor(
    private notify: NotificationService,
    private recipeService: RecipeService, 
    public r: Router,
    private cdr: ChangeDetectorRef // הזרקת מזהה השינויים
  ) {}

  ngOnInit(): void {}

  // --- פונקציות הזיהוי הקולי ---

startFridgeVoice() {
  const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  
  if (!SpeechRecognition) {
    this.notify.alert("הדפדפן שלך לא תומך בזיהוי קולי.", 'וודא שאתה משתמש בדפדפן עדכני', 'error');
    return;
  }

  // 1. קודם כל - המקרר שואל שאלה
  const greeting = new SpeechSynthesisUtterance("מה יש לך במקרר היום?");
  greeting.lang = 'he-IL';
  greeting.rate = 1.0;

  // 2. רק כשהוא מסיים לשאול, המיקרופון נפתח להאזנה
  greeting.onend = () => {
    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.isListening = true;
      this.cdr.detectChanges();
      this.notify.toast('🎤 מקשיבה... דבר עכשיו', 'info');
    };

    recognition.onresult = (event: any) => {
      if (event.results.length > 0 && event.results[0].length > 0) {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim().length > 0) {
          this.processIngredientsVoice(transcript);
          this.isListening = false;
          this.cdr.detectChanges();
          
          // בונוס: פידבק של הצלחה
          const success = new SpeechSynthesisUtterance("הבנתי, מחפשת מתכונים מתאימים");
          success.lang = 'he-IL';
          window.speechSynthesis.speak(success);


          
          // חיפוש אוטומטי אחרי קול recognition
          setTimeout(() => this.findRecipes(),100);
        }
      }
    };

    recognition.onerror = (event: any) => {
      this.isListening = false;
      this.cdr.detectChanges();
      
      let errorMsg = 'שגיאה בזיהוי קולי';
      if (event.error === 'no-speech') {
        errorMsg = 'לא שמעתי קול. נסה שוב';
      } else if (event.error === 'network') {
        errorMsg = 'בעיית חיבור. בדוק את האינטרנט';
      } else if (event.error === 'not-allowed') {
        errorMsg = 'לא הרשאה למיקרופון. בדוק הרשאות בדפדפן';
      }
      this.notify.alert('שגיאה', errorMsg, 'error');
    };

    recognition.onend = () => {
      this.isListening = false;
      this.cdr.detectChanges();
    };

    recognition.start();
  };

  // הפעלת השאלה הקולית
  window.speechSynthesis.speak(greeting);
}

  processIngredientsVoice(text: string) {
    // פיצול לפי המילה "ו-" או פסיק או רווח
    const words = text.split(/ ו| ו-| ,| /).filter(w => w.trim().length > 1);
    
    words.forEach(word => {
      // אם התיבה האחרונה ריקה, נמלא אותה. אם לא, נוסיף חדשה.
      const lastIndex = this.userIngredients.length - 1;
      if (this.userIngredients[lastIndex].trim() === '') {
        this.userIngredients[lastIndex] = word;
      } else {
        this.userIngredients.push(word);
      }
    });
    
    this.cdr.detectChanges(); // הכרחי כדי שהתיבות יתמלאו על המסך מיד
  }

  // --- פונקציות קיימות ---

  addInput() {
    this.userIngredients.push('');
  }

  removeInput(index: number) {
    if (this.userIngredients.length > 1) {
      this.userIngredients.splice(index, 1);
    } else {
      this.userIngredients[0] = '';
    }
  }

  // --- הוספת input אוטומטי כאשר עוזבים שדה קלט עם ערך ---
  onIngredientBlur(index: number) {
    const currentValue = this.userIngredients[index].trim();
    const isLastInput = index === this.userIngredients.length - 1;
    
    // אם זה השדה האחרון והוא יש בו ערך - הוסף input חדש
    if (isLastInput && currentValue !== '') {
      this.addInput();
    }
  }

  findRecipes() {
    const finalIngredients = this.userIngredients.filter(ing => ing.trim() !== '');
    if (finalIngredients.length === 0) return;

    this.recipeService.findBestMatch(finalIngredients).subscribe(data => {
      this.matchingRecipes = data;
    });
  }
}