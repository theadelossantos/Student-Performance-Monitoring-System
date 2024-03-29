import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PostProvider } from 'src/app/providers/post-provider';
import { AuthService } from 'src/app/services/auth.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-weeklyprog',
  templateUrl: './weeklyprog.page.html',
  styleUrls: ['./weeklyprog.page.scss'],
})
export class WeeklyprogPage implements OnInit {
  subjects: any[] = [];
  studentProgress: { [subjectId: number]: any[] } = {};
  studentId: number = 0;
  sectionId: number = 0;
  selectedSubjectId: number = 0;
  selectedMonth: string = '';
  months: string [] = [];
  weeks: {[month: string]: string[]} = {}
  openAccordions: { [subjectId: number]: boolean } = {};

  constructor(
    private http: HttpClient,
    private postPvdr: PostProvider,
    private authService: AuthService,
    private storage: Storage
  ) {}

  ngOnInit() {
    // this.fetchSubjects();
    // this.fetchUserInfo();
    // this.initializeAccordions();
    // this.setMonths();
    // this.selectedMonth = 'This week'; 

  }

  ionViewWillEnter() {
    this.fetchSubjects();
    this.fetchUserInfo();
    this.initializeAccordions();
    this.setMonths();
    this.selectedMonth = 'This week'; 
  }

  fetchSubjects() {
    const body = {
      aksi: 'get_subjects',
    };

    this.postPvdr.postData(body, 'server_api/file_aksi.php').subscribe(
      (response: any) => {
        console.log('Subjects Response:', response);
        this.subjects = response.subjects.map((subject: string, index: number) => {
          return { subject_id: index + 1, subject_name: subject };
        });
      },
      (error: any) => {
        console.error('Subjects Error:', error);
      }
    );
  }

  setMonths() {
    this.months = ['This week', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
    const currentDate = new Date();
    const currentMonth = this.months[currentDate.getMonth()];
    this.selectedMonth = currentMonth;
  }
  

  initializeAccordions() {
    for (const subject of this.subjects) {
      this.openAccordions[subject.subject_id] = false;
    }
  }

  async fetchUserInfo() {
    const user = await this.storage.get('session_storage');
    if (user) {
      this.sectionId = user.section_id; 
      this.studentId = user.user_id;
      this.fetchStudentProgress(this.studentId, this.selectedSubjectId, this.sectionId, this.selectedMonth);
    }
  }
  

  fetchStudentProgress(studentId: number, sectionId: number, subjectId: number, month:string) {
    const body: any = {
      aksi: 'get_student_progress',
      student_id: studentId,
      subject_id: subjectId,
      section_id: sectionId,
    };

    if(month && month !== 'This week'){
      body.month = month;
    }else{
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 6);
      body.start_date = startOfWeek.toISOString().split('T')[0];
      body.end_date = endOfWeek.toISOString().split('T')[0];
    }

    
    console.log('Progress Console:',body)
    
    this.postPvdr.postData(body, 'server_api/file_aksi.php').subscribe(
      (response: any) => {
        console.log('Student Progress Response:', response);
        if (response.progress && Array.isArray(response.progress)) {
          this.studentProgress[subjectId] = response.progress.map((activity: any) => {
            return {
              activity_name: activity.activity_name,
              score_value: activity.score_value,
              status_value: activity.status_value,
            };
          });
        } else {
          console.error('Invalid student progress response:', response);
        }
      },
      (error: any) => {
        console.error('Student Progress Error:', error);
      }
    );
  }
  

  toggleAccordion(subjectId: number) {
    if (this.openAccordions[subjectId]) {
      this.openAccordions[subjectId] = false;
    } else {
      this.openAccordions[subjectId] = true;
      this.selectedSubjectId = subjectId;
      this.fetchStudentProgress(this.studentId, this.sectionId, subjectId, this.selectedMonth);
    }
  }

  isAccordionOpen(subjectId: number) {
    return this.openAccordions[subjectId];
  }

  getIconName(status: string) {
    if (status === 'completed') {
      return 'checkmark-circle';
    } else if (status === 'missing') {
      return 'help-circle';
    } else if (status === 'failed') {
      return 'close-circle';
    } else {
      return '';
    }
  }

  getIconColor(status: string): string {
    if (status === 'completed') {
      return 'success';
    } else if (status === 'missing') {
      return 'warning';
    } else if (status === 'failed') {
      return 'danger';
    } else {
      return 'medium'; 
    }
  }

  onMonthChange(){
    if (this.selectedMonth === 'This week'){
      this.selectedSubjectId = 0;
      this.fetchStudentProgress(this.studentId, this.sectionId, this.selectedSubjectId, this.selectedMonth);
    }else{
      this.studentProgress = {};
      this.selectedSubjectId = 0;
      this.fetchStudentProgress(this.studentId, this.sectionId, this.selectedSubjectId, this.selectedMonth)
    }
  }
}
