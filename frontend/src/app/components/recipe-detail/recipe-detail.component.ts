import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../environments/environment';

// דף פרטי המתכון - הצגת מתכון מלא עם מרכיבים, הוראות, דירוג, טיימר, וקול
@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.css',
})
export class RecipeDetailComponent implements OnInit {
  // משתנים ראשיים
  recipe: any; // אובייקט המתכון שנטען מה-backend

  // משתנים של מצב UI
  isListening = false; // האם מוקד קול פתוח?
  isFavorite: boolean = false; // האם המתכון בחיוביים?
  userRating: number = 0; // דירוג של המשתמש (0-5 כוכבים)
  apiUrl: string = environment.apiUrl;
  constructor(
    private notify: NotificationService,
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private cdr: ChangeDetectorRef // זיהוי שינויים ב-UI (חשוב לקול/טיימר)
  ) {}

  currentMainImage: string = ''; // תמונה גדולה שמוצגת כרגע

  // --- פונקציות ניהול תמונות ---

  // משנים את התמונה הגדולה שמוצגת
  changeMainImage(newPath: string) {
    this.currentMainImage = newPath;
  }

  // טוען את פרטי המתכון מהשרת בהיכנס לדף
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id'); // מקבל את ID המתכון מ-URL
    if (id) {
      this.recipeService.getRecipeById(id).subscribe((data) => {
        this.recipe = data;
        this.currentMainImage = data.image_path; // הגדר תמונה ראשית

        // טוען מידע על דירוג ומועדפים של המשתמש הנוכחי
        this.isFavorite = data.is_favorite;
        this.userRating = data.user_rating;

        // אתחול: כל מרכיב מתחיל כלא-בחור
        if (this.recipe.ingredients) {
          this.recipe.ingredients.forEach((ing: any) => (ing.checked = false));
        }
      });
    }
  }

  // --- פונקציות דירוג ומועדפים ---

// דירוג המתכון - משמור הדירוג בשרת ועדכון הממוצע
rateRecipe(stars: number) {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  if (!userData.id) {
    this.notify.alert('חובה להתחבר כדי לדרג', '', 'error');
    return;
  }

  // שלחת את הדירוג לשרת עם מזהה המתכון והמשתמש
  this.recipeService.addReview(this.recipe.id, stars, userData.id).subscribe({
    next: (res) => {
      this.recipe.rating = res.new_avg; // עדכון ממוצע הדירוג בתצוגה
      this.userRating = stars; // צביעת הכוכבים שנבחרו
      // ✅ הודעה חדשה לאחר דירוג
      this.notify.toast(`⭐ דירגת את המתכון ב-${stars} כוכבים!`, 'success');
    },
    error: (err) => {
      this.notify.alert('שגיאה', 'לא ניתן לשמור את הדירוג', 'error');
    }
  });
}

// הוספה/הסרה מתוך מועדפים
toggleFavorite() {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  if (!userData.id) {
    this.notify.alert('חובה להתחבר כדי לשמור במועדפים', '', 'error');
    return;
  }

  // שלחת בקשה לשרת לעדכון סטטוס המועדפים
  this.recipeService.toggleFavorite(this.recipe.id, userData.id).subscribe({
    next: (res) => {
      this.isFavorite = res.is_favorite; // עדכון הלב בתצוגה
      // ✅ הודעה חדשה כשמוסיפים/מסירים מעדפים
      const message = res.is_favorite ? '❤️ נוסף למועדפים!' : '💔 הוסר מהמועדפים';
      this.notify.toast(message, res.is_favorite ? 'success' : 'info');
    },
    error: (err) => {
      this.notify.alert('שגיאה', 'לא ניתן לעדכן את המועדפים', 'error');
    }
  });
}
  // --- פונקציות זיהוי קול למצרכים ---

  // הפעלת זיהוי קול לבחירת מצרכים
  startVoiceRecognition() {
    // בדיקה אם הדפדפן תומך בזיהוי קולי (webkit או standard)
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      this.notify.alert('הדפדפן שלך לא תומך בזיהוי קולי. נסה להשתמש ב-Chrome.', '', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL'; // השפה העברית
    recognition.continuous = false; // רק עד הפסקה אחת

    recognition.onstart = () => {
      this.isListening = true; // הצג מצב "מקשיבה"
    };

    recognition.onresult = (event: any) => {
      // קבל את הטקסט שנזהה
      const transcript = event.results[0][0].transcript;
      console.log('זיהיתי קול:', transcript);

      // בדוק אם מילה זו מתאימה למצרך
      this.checkIngredientByVoice(transcript);

      this.isListening = false; // סיים הקשות
      this.cdr.detectChanges(); // עדכן את ה-UI
    };

    recognition.onerror = (event: any) => {
      console.error('שגיאת זיהוי קולי:', event.error);
      this.isListening = false;
    };

    recognition.start(); // התחל להאזין
  }

  // בדיקה אם השם שנאמר תואם למצרך כלשהו וסימונו
  checkIngredientByVoice(text: string) {
    const spokenText = text.toLowerCase().trim();

    // לולאה על כל המצרכים בהוראה
    this.recipe.ingredients.forEach((ing: any) => {
      const ingredientName = ing.product_name.toLowerCase().trim();

      // חיפוש חכם: האם המילה שנאמרה נמצאת בתוך שם המצרך או להפך
      if (
        spokenText.includes(ingredientName) ||
        ingredientName.includes(spokenText)
      ) {
        ing.checked = true; // סימון כבחור

        // הוספת פידבק קולי - אמור למשתמש שסימנתי את המצרך
        const msg = new SpeechSynthesisUtterance(`סימנתי ${ing.product_name}`);
        msg.lang = 'he-IL';
        window.speechSynthesis.speak(msg);
      }
    });
  }

  // --- פונקציות מרכיבים וקול ---

  // משתנה לבדיקה אם האתר כרגע מקריא
  isSpeaking = false;

  // סימון/ביטול סימון של מצרך עם הודעה קולית
  toggleIngredient(ingredientName: string, index: number) {
    // החלף את הסטטוס של המצרך (סומן/לא סומן)
    this.recipe.ingredients[index].checked = !this.recipe.ingredients[index].checked;
    
    // בנה הודעה בהתאם לסטטוס החדש
    const isChecked = this.recipe.ingredients[index].checked;
    const message = isChecked 
      ? `✓ סימנת ${ingredientName}` 
      : `☐ ביטלת סימון של ${ingredientName}`;
    
    // הצג הודעה טוסט למשתמש
    this.notify.toast(message, isChecked ? 'success' : 'info');
    
    // מנגנת קול של ההודעה
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'he-IL';
    utterance.rate = 0.95; // קצת איטי לדיוק
    window.speechSynthesis.speak(utterance);
  }

  // קריאה של המתכון כולו בקול - מתחיל/עוצר
  readRecipe() {
    // אם כרגע קורא, עצור
    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      return;
    }

    // בנה טקסט לקריאה: שם, קושי, מנות, זמן, מצרכים, הוראות
    let textToRead = `המתכון עבור ${this.recipe.title}. `;
    textToRead += `רמת הקושי היא ${this.recipe.difficulty || 'לא צוינה'}. `;
    textToRead += `המתכון מיועד עבור ${this.recipe.servings || ''} סועדים. `;
    textToRead += `זמן ההכנה הוא ${this.recipe.time_to_prepare} דקות. `;
    textToRead += 'המצרכים הם: ';
    // הוסף כל מצרך לטקסט
    this.recipe.ingredients.forEach((ing: any) => {
      textToRead += `${ing.amount} ${ing.unit} ${ing.product_name}. `;
    });
    textToRead += 'הוראות ההכנה הן: ';
    textToRead += this.recipe.instructions; // הוספת ההוראות

    // צור אובייקט של קול לקריאה
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'he-IL'; // עברית
    utterance.rate = 0.9; // מהירות אט מעט

    // כאשר קריאה מסתיימת
    utterance.onend = () => {
      this.isSpeaking = false;
      this.saySuccessMessage(); // אמור "אני סיימתי לקרוא"
    }

    this.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  }

  // פונקציה נפרדת למילת ההצלחה
  saySuccessMessage() {
    const successPhrases = [
      'בהצלחה בבישול! אני בטוחה שייצא טעים',
      'סיימנו את ההקראה, שיהיה בתיאבון',
      'עכשיו תורך, בהצלחה',
    ];

    // בחירת משפט רנדומלי מהרשימה
    const randomPhrase =
      successPhrases[Math.floor(Math.random() * successPhrases.length)];

    const successUtterance = new SpeechSynthesisUtterance(randomPhrase);
    successUtterance.lang = 'he-IL';
    window.speechSynthesis.speak(successUtterance);
  }










  timer: any;
timeLeft: number = 0; // בשניות
isTimerRunning: boolean = false;

toggleTimer() {
  if (this.isTimerRunning) {
    this.pauseTimer();
  } else {
    if (this.timeLeft === 0) {
      this.timeLeft = this.recipe.time_to_prepare * 60; // המרה מדקות לשניות
    }
    this.startTimer();
  }
}

startTimer() {
  this.isTimerRunning = true;
  this.timer = setInterval(() => {
    if (this.timeLeft > 0) {
      this.timeLeft--;
    } else {
      this.pauseTimer();
      this.notify.alert('הזמן עבר!', 'המתכון שלך מוכן?', 'success');
      // אפשר להוסיף כאן צליל התראה
    }
  }, 1000);
}

pauseTimer() {
  this.isTimerRunning = false;
  clearInterval(this.timer);
}
// פונקציה להדפסה
printRecipe(): void {
  window.print();
}
resetTimer() {
  this.pauseTimer();
  this.timeLeft = this.recipe.time_to_prepare * 60;
}

formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
}
