/* data.jsx — bilingual copy + sample patient data for the Balsm patient app */

/* ── i18n dictionary ─────────────────────────────────────── */
const STR = {
  /* Welcome */
  w_title:   { en: "Your health, kept close.", ar: "صحتك، دائماً قريبة." },
  w_sub:     { en: "Daily check-ins, medication reminders, and trends — saved on your phone, synced when you're ready.",
               ar: "متابعة يومية، تذكير بالدواء، ورسوم بيانية — محفوظة على هاتفك، وتُزامَن عند رغبتك." },
  w_start:   { en: "Get started", ar: "ابدأ الآن" },
  w_have:    { en: "I already have an account", ar: "لديّ حساب بالفعل" },
  w_signin:  { en: "Sign in", ar: "تسجيل الدخول" },
  w_or:      { en: "or", ar: "أو" },
  w_apple:   { en: "Continue with Apple", ar: "المتابعة مع Apple" },
  w_google:  { en: "Continue with Google", ar: "المتابعة مع Google" },

  /* username */
  un_label:  { en: "Handle",             ar: "المعرّف"              },
  un_hint:   { en: "Choose your @handle", ar: "اختر معرّفك @handle"  },
  un_ph:     { en: "e.g. layla_hassan",  ar: "مثال: layla_hassan"   },
  un_prefix: { en: "@balsm/",            ar: "@balsm/"               },
  un_avail:  { en: "Available",          ar: "متاح"                 },
  un_taken:  { en: "Already taken",      ar: "مأخوذ بالفعل"          },
  un_checking:{ en: "Checking…",         ar: "جارٍ التحقق…"          },
  un_invalid:{ en: "Only letters, numbers, and _ (3–20 chars)", ar: "أحرف وأرقام و_ فقط (3–20 حرفاً)" },
  un_saved:  { en: "Username saved",     ar: "تم حفظ اسم المستخدم"   },

  /* connected accounts */
  conn_accounts: { en: "Connected accounts",   ar: "الحسابات المرتبطة"  },
  conn_apple:    { en: "Apple ID",              ar: "Apple ID"           },
  conn_google:   { en: "Google account",        ar: "حساب Google"         },
  conn_connect:  { en: "Connect",               ar: "ربط"                },
  conn_remove:   { en: "Remove",                ar: "إلغاء الربط"         },
  conn_primary:  { en: "Used to sign in",       ar: "يُستخدم لتسجيل الدخول" },
  /* auth contact */
  em_title:  { en: "What's your email?",     ar: "ما هو بريدك الإلكتروني؟"  },
  em_help:   { en: "We’ll send you a code to verify it’s you.", ar: "سنرسل لك رمزاً للتحقق من هويتك." },
  em_label:  { en: "Email address",            ar: "البريد الإلكتروني"      },
  em_ph:     { en: "you@example.com",          ar: "you@example.com"        },
  em_otp_h:  { en: "We sent a 6-digit code to", ar: "أرسلنا رمزاً من 6 أرقام إلى" },
  use_phone: { en: "Use phone instead",         ar: "استخدم رقم الهاتف"    },
  use_email: { en: "Use email instead",          ar: "استخدم البريد الإلكتروني" },
  trust_device:  { en: "Yours, always",         ar: "ملكك دائماً" },
  trust_private: { en: "Private by default",    ar: "خصوصية افتراضية" },
  trust_offline: { en: "Works offline",         ar: "يعمل دون إنترنت" },

  /* Phone */
  ph_title:  { en: "What's your number?", ar: "ما رقم هاتفك؟" },
  ph_help:   { en: "We'll text you a code to confirm it's you.", ar: "سنرسل لك رمزاً عبر رسالة للتأكد من هويتك." },
  ph_label:  { en: "Mobile number", ar: "رقم الموبايل" },
  ph_terms:  { en: "By continuing you agree to Balsm's terms and privacy policy.", ar: "بالمتابعة فإنك توافق على شروط بلسم وسياسة الخصوصية." },
  continue:  { en: "Continue", ar: "متابعة" },

  /* OTP */
  otp_title: { en: "Enter your code", ar: "أدخل رمز التحقق" },
  otp_help:  { en: "We sent a 6-digit code to", ar: "أرسلنا رمزاً من 6 أرقام إلى" },
  otp_resend:{ en: "Resend code", ar: "إعادة إرسال الرمز" },
  otp_in:    { en: "Resend in", ar: "إعادة الإرسال خلال" },
  otp_wrong: { en: "Wrong number?", ar: "الرقم غير صحيح؟" },
  verify:    { en: "Verify", ar: "تأكيد" },

  /* Profile setup */
  pf_title:  { en: "Tell us about you", ar: "عرّفنا بنفسك" },
  pf_help:   { en: "This helps your care team read your reports correctly.", ar: "هذا يساعد فريق الرعاية على قراءة تقاريرك بدقة." },
  pf_fname:   { en: "First name", ar: "الاسم الأول"  },
  pf_lname:   { en: "Last name",  ar: "اسم العائلة" },
  pf_fname_ph:{ en: "e.g. Layla", ar: "مثال: ليلى"   },
  pf_lname_ph:{ en: "e.g. Hassan", ar: "مثال: حسن"  },
  pf_dob:    { en: "Date of birth", ar: "تاريخ الميلاد" },
  pf_gender: { en: "Gender", ar: "النوع" },
  pf_female: { en: "Female", ar: "أنثى" },
  pf_male:   { en: "Male", ar: "ذكر" },
  pf_gov:    { en: "Governorate", ar: "المحافظة" },
  pf_create: { en: "Create my profile", ar: "إنشاء ملفّي" },
  pf_secure: { en: "Your details stay on this device.", ar: "تبقى بياناتك على هذا الجهاز." },

  /* Home */
  greet:      { en: "Good morning", ar: "صباح الخير" },
  today_lbl:  { en: "Today's check-in", ar: "متابعة اليوم" },
  hero_q:     { en: "How are you feeling today?", ar: "كيف تشعرين اليوم؟" },
  hero_cta:   { en: "Start check-in", ar: "ابدأ المتابعة" },
  hero_time:  { en: "About 2 minutes", ar: "حوالي دقيقتين" },
  done_lbl:   { en: "All done for today", ar: "انتهيتِ لليوم" },
  done_q:     { en: "Check-in complete", ar: "اكتملت المتابعة" },
  streak:     { en: "day streak", ar: "يوم متتالٍ" },
  streak_help:{ en: "Checked in 6 of the last 7 days", ar: "تابعتِ 6 من آخر 7 أيام" },
  latest:     { en: "Latest readings", ar: "آخر القياسات" },
  meds_today: { en: "Today's medications", ar: "أدوية اليوم" },
  recent:     { en: "Recent reports", ar: "آخر التقارير" },
  see_all:    { en: "See all", ar: "عرض الكل" },
  taken:      { en: "Taken", ar: "مأخوذ" },
  due:        { en: "Due", ar: "مستحق" },
  take:       { en: "Take", ar: "أخذ" },

  /* metrics */
  m_bp:       { en: "Blood pressure", ar: "ضغط الدم" },
  m_glucose:  { en: "Blood glucose", ar: "سكر الدم" },
  m_mood:     { en: "Mood", ar: "الحالة" },
  m_pain:     { en: "Pain", ar: "الألم" },
  m_weight:   { en: "Weight", ar: "الوزن" },
  unit_bp:    { en: "mmHg", ar: "ملم زئبق" },
  unit_glu:   { en: "mg/dL", ar: "مجم/دل" },
  bp_normal:  { en: "In range", ar: "ضمن المعدل" },
  bp_high:    { en: "A little high", ar: "أعلى قليلاً" },
  yesterday:  { en: "vs yesterday", ar: "عن أمس" },

  /* Report flow */
  step_of:    { en: "of", ar: "من" },
  back:       { en: "Back", ar: "رجوع" },
  finish:     { en: "Finish check-in", ar: "إنهاء المتابعة" },
  skip_q:     { en: "I didn't measure this today", ar: "لم أقِس هذا اليوم" },

  q_mood_t:   { en: "How are you feeling today?", ar: "كيف تشعرين اليوم؟" },
  q_mood_h:   { en: "Pick the face that fits best.", ar: "اختاري الوجه الأقرب لحالتك." },
  mood_1:     { en: "Rough", ar: "متعبة" },
  mood_2:     { en: "Low", ar: "ضعيفة" },
  mood_3:     { en: "Okay", ar: "عادية" },
  mood_4:     { en: "Good", ar: "جيدة" },
  mood_5:     { en: "Great", ar: "ممتازة" },

  q_bp_t:     { en: "What's your blood pressure?", ar: "كم ضغط دمك؟" },
  q_bp_h:     { en: "Tap a number, then use the keypad.", ar: "اضغطي على الرقم ثم استخدمي لوحة الأرقام." },
  sys:        { en: "Systolic", ar: "الانقباضي" },
  dia:        { en: "Diastolic", ar: "الانبساطي" },

  q_glu_t:    { en: "And your blood sugar?", ar: "وكم نسبة السكر؟" },
  q_glu_h:    { en: "Enter the reading from your glucometer.", ar: "أدخلي القراءة من جهاز قياس السكر." },
  glu_fast:   { en: "Fasting", ar: "صائمة" },
  glu_meal:   { en: "After a meal", ar: "بعد الأكل" },
  glu_random: { en: "Random", ar: "عشوائي" },

  q_med_t:    { en: "Did you take your medications?", ar: "هل أخذتِ أدويتك؟" },
  q_med_h:    { en: "Tap each one you've taken today.", ar: "اضغطي على كل دواء أخذتِه اليوم." },
  skipped:    { en: "Skipped", ar: "لم يُؤخذ" },
  mark_skip:  { en: "Didn't take", ar: "لم آخذه" },

  q_sym_t:    { en: "Any pain or symptoms?", ar: "هل لديك ألم أو أعراض؟" },
  q_sym_h:    { en: "Slide to your pain level, then tap anything you feel.", ar: "حرّكي المؤشر لمستوى الألم، ثم اختاري ما تشعرين به." },
  pain_0:     { en: "No pain", ar: "لا ألم" },
  pain_mild:  { en: "Mild", ar: "خفيف" },
  pain_mod:   { en: "Moderate", ar: "متوسط" },
  pain_sev:   { en: "Severe", ar: "شديد" },
  pain_worst: { en: "Worst", ar: "الأسوأ" },
  note_lbl:   { en: "Anything else? (optional)", ar: "أي شيء آخر؟ (اختياري)" },
  note_ph:    { en: "Add a note for your doctor…", ar: "اكتبي ملاحظة لطبيبك…" },
  add_photo:  { en: "Add a photo", ar: "إضافة صورة" },

  /* symptoms */
  s_headache: { en: "Headache",        ar: "صداع" },
  s_dizzy:    { en: "Dizziness",       ar: "دوخة" },
  s_fatigue:  { en: "Fatigue",         ar: "إرهاق" },
  s_blurred:  { en: "Blurred vision",  ar: "تشوش الرؤية" },
  s_swelling: { en: "Swelling",        ar: "تورّم" },
  s_chest:    { en: "Chest tightness", ar: "ضيق بالصدر" },
  s_nausea:   { en: "Nausea",          ar: "غثيان" },
  s_thirst:   { en: "Excess thirst",   ar: "عطش زائد" },
  s_tingling: { en: "Tingling",         ar: "تنميل" },
  s_itching:  { en: "Itching",          ar: "حكة" },
  s_none:     { en: "Nothing",         ar: "لا شيء" },

  /* Summary */
  saved_t:     { en: "Check-in saved",  ar: "تم حفظ المتابعة" },
  saved_local: { en: "Saved locally. Will sync when you reconnect.", ar: "حُفظ محلياً — ستتم المزامنة عند الاتصال." },
  to_doctor:   { en: "A copy reaches Dr. Sara at your next visit.", ar: "ستصل نسخة إلى د. سارة في زيارتك القادمة." },
  meds_taken:  { en: "taken",         ar: "مأخوذة" },
  to_home:     { en: "Back to home",  ar: "العودة للرئيسية" },
  view_trends: { en: "View trends",   ar: "عرض الرسوم" },
  no_symptoms: { en: "No symptoms",   ar: "لا أعراض" },

  /* Trends / history */
  trends:    { en: "Trends",    ar: "الرسوم البيانية" },
  reports:   { en: "Past reports", ar: "التقارير السابقة" },
  range_w:   { en: "Week",   ar: "أسبوع" },
  range_m:   { en: "Month",  ar: "شهر" },
  range_3m:  { en: "3 months", ar: "3 أشهر" },
  avg:       { en: "avg", ar: "متوسط" },

  /* Meds tab */
  medications: { en: "Medications", ar: "الأدوية" },
  morning:     { en: "Morning",     ar: "الصباح" },
  evening:     { en: "Evening",     ar: "المساء" },
  adherence:   { en: "this week",   ar: "هذا الأسبوع" },
  on_track:    { en: "On track",    ar: "ملتزمة" },

  /* Profile */
  profile:    { en: "Profile",    ar: "الملف الشخصي" },
  since:      { en: "Balsm patient since", ar: "مريضة بلسم منذ" },
  p_personal: { en: "Account details",    ar: "بيانات الحساب"   },
  p_cond:     { en: "Medical profile", ar: "الملف الطبي" },

  /* personal detail field labels */
  pd_fname:    { en: 'First name',        ar: 'الاسم الأول'       },
  pd_lname:    { en: 'Last name',         ar: 'اسم العائلة'    },
  pd_dob:      { en: 'Date of birth',     ar: 'تاريخ الميلاد'    },
  pd_gender:   { en: 'Gender',            ar: 'النوع'           },
  pd_phone:    { en: 'Mobile number',     ar: 'رقم الهاتف'       },
  pd_nid:      { en: 'National ID',       ar: 'الرقم القومي'      },
  pd_blood:    { en: 'Blood type',        ar: 'فصيلة الدم'       },
  pd_weight:   { en: 'Weight',            ar: 'الوزن'           },
  pd_height:   { en: 'Height',            ar: 'الطول'           },
  pd_emergency:{ en: 'Emergency contact', ar: 'جهة اتصال الطوارئ' },
  pd_em_name:  { en: 'Name',              ar: 'الاسم'            },
  pd_em_rel:   { en: 'Relationship',      ar: 'صلة القرابة'     },
  pd_em_phone: { en: 'Phone',             ar: 'الهاتف'           },
  pd_female:   { en: 'Female',            ar: 'أنثى'           },
  pd_male:     { en: 'Male',              ar: 'ذكر'            },
  pd_save:     { en: 'Save changes',      ar: 'حفظ التغييرات'    },
  pd_saved:    { en: 'Saved',             ar: 'تم الحفظ'         },
  pd_kg:       { en: 'kg',               ar: 'كج'            },
  pd_cm:       { en: 'cm',               ar: 'سم'            },
  bmi_label:   { en: 'BMI',              ar: 'مؤشر الكتلة'   },
  bmi_under:   { en: 'Underweight',      ar: 'نقص الوزن'     },
  bmi_normal:  { en: 'Healthy weight',   ar: 'وزن صحي'       },
  bmi_over:    { en: 'Overweight',       ar: 'زيادة الوزن'   },
  bmi_obese:   { en: 'Obese',            ar: 'سمنة'          },
  p_care:     { en: "Care team",   ar: "فريق الرعاية" },
  p_notif:    { en: "Reminders",   ar: "التذكيرات" },
  p_lang:     { en: "Language",    ar: "اللغة" },
  p_privacy:  { en: "Privacy & data", ar: "الخصوصية والبيانات" },
  p_help:     { en: "Help & support", ar: "المساعدة والدعم" },
  p_signout:  { en: "Sign out",    ar: "تسجيل الخروج" },

  /* Emergency quick contacts (Egypt nationwide) */
  p_emergency:  { en: "Emergency",      ar: "طوارئ" },
  em_eg:        { en: "Egypt",          ar: "مصر" },
  em_ambulance: { en: "Ambulance",      ar: "إسعاف" },
  em_police:    { en: "Police",         ar: "شرطة" },
  em_fire:      { en: "Fire & rescue",  ar: "مطافئ" },
  em_tourist:   { en: "Tourist police", ar: "شرطة السياحة" },
  em_intro:     { en: "Egypt's nationwide emergency lines. Tap any number to call right away.", ar: "أرقام الطوارئ في مصر. اضغط أي رقم للاتصال فوراً." },
  em_tap_call:  { en: "Tap to call",    ar: "اضغط للاتصال" },

  /* tabs */
  tab_home:    { en: "Home",    ar: "الرئيسية" },
  tab_map:     { en: "Nearby",  ar: "قريب منك"  },
  tab_meds:    { en: "Meds",    ar: "الأدوية"   },
  tab_profile: { en: "Profile", ar: "الملف"     },

  /* ── Appointments ──────────────────────────── */
  appts:         { en: "Appointments",         ar: "المواعيد" },
  upcoming_appt: { en: "Upcoming appointment", ar: "الموعد القادم" },
  past_appts:    { en: "Past visits",          ar: "الزيارات السابقة" },
  book_appt:     { en: "Book",                 ar: "حجز" },
  no_appts:      { en: "No upcoming appointments", ar: "لا مواعيد قادمة" },
  book_first:    { en: "Book your first appointment", ar: "احجز موعدك الأول" },
  book_specialty:{ en: "What do you need?",    ar: "ما الذي تحتاجين؟" },
  book_specialty_h: { en: "Choose a specialty to find the right doctor.", ar: "اختاري التخصص للعثور على الطبيب المناسب." },
  book_doctor:   { en: "Choose a doctor",      ar: "اختاري الطبيب" },
  book_slot:     { en: "Pick a time",          ar: "اختاري الوقت" },
  book_confirm:  { en: "Confirm booking",      ar: "تأكيد الحجز" },
  book_done:     { en: "Appointment booked!",  ar: "تم حجز الموعد!" },
  book_ref:      { en: "Booking reference",    ar: "رقم الحجز" },
  book_morning:  { en: "Morning",              ar: "الصباح" },
  book_afternoon:{ en: "Afternoon",            ar: "بعد الظهر" },
  follow_up:     { en: "Follow-up",            ar: "متابعة" },
  check_up:      { en: "Check-up",             ar: "فحص دوري" },
  add_calendar:  { en: "Add to calendar",      ar: "أضف للتقويم" },
  experience:    { en: "experience",           ar: "خبرة" },

  /* ── Quick log ──────────────────────────────── */
  symptoms:      { en: 'Symptoms',        ar: 'الأعراض'              },
  full_checkin:  { en: 'Full check-in',   ar: 'المتابعة الكاملة'     },
  quick_log_or:  { en: 'or log just one', ar: 'أو سجّل قراءة واحدة' },

  /* ── Body map / Quick log ─────────────────── */
  body_location:  { en: 'Where does it hurt?',   ar: 'أين يؤلمك؟'              },
  your_accounts:  { en: 'Your accounts',          ar: 'حساباتك'                 },
  switch_account: { en: 'Switch account',         ar: 'تبديل الحساب'            },
  add_member:     { en: 'Add family member',      ar: 'إضافة فرد من الأسرة'     },
  book_via_doctor:{ en: 'Your care team will schedule appointments for you.', ar: 'سيقوم فريق رعايتك بجدولة المواعيد لك.' },

  /* ── Prescriptions ─────────────────────────── */
  prescriptions: { en: "Prescriptions",        ar: "الوصفات الطبية" },
  rx_active:     { en: "Active",               ar: "فعّالة" },
  rx_expired:    { en: "Expired",              ar: "منتهية" },
  rx_valid_until:{ en: "Valid until",          ar: "صالحة حتى" },
  rx_show:       { en: "Show to pharmacist",   ar: "أظهر للصيدلاني" },
  rx_scan:       { en: "Scan to dispense",     ar: "امسح للصرف" },

  /* ── Settings: language & country ──────────── */
  p_country:      { en: "Country",              ar: "الدولة"                  },
  choose_lang:    { en: "Choose language",      ar: "اختر اللغة"              },
  choose_country: { en: "Where are you now?",   ar: "أين أنت الآن؟"           },
  travel_help:    { en: "Set your location so Balsm shows local emergency numbers and care info while you travel.", ar: "حدّد موقعك ليعرض بلسم أرقام الطوارئ ومعلومات الرعاية المحلية أثناء سفرك." },
  lang_full:      { en: "Full support",         ar: "دعم كامل"               },
  lang_beta:      { en: "Beta",                 ar: "تجريبي"                 },
  home_country:   { en: "Home",                 ar: "بلدك"                   },
  away_banner:    { en: "You're away from home", ar: "أنت خارج بلدك"          },
  emergency:      { en: "Emergency",            ar: "الطوارئ"                },

  /* ── Health records ────────────────────────── */
  records:        { en: "Health records",       ar: "السجلات الصحية"          },
  records_short:  { en: "Records",              ar: "السجلات"                },
  add_record:     { en: "Add record",           ar: "إضافة سجل"              },
  all_records:    { en: "All",                  ar: "الكل"                   },
  rec_lab:        { en: "Lab tests",            ar: "تحاليل"                 },
  rec_scan:       { en: "Scans",                ar: "أشعة"                   },
  rec_report:     { en: "Reports",              ar: "تقارير"                 },
  rec_lab_one:    { en: "Lab test",             ar: "تحليل"                  },
  rec_scan_one:   { en: "Scan",                 ar: "أشعة"                   },
  rec_report_one: { en: "Report",               ar: "تقرير"                  },
  rec_self:       { en: "You uploaded",         ar: "رفعتَه بنفسك"            },
  rec_pick_type:  { en: "What are you adding?",  ar: "ما الذي تضيفه؟"          },
  rec_title:      { en: "Title",                ar: "العنوان"                },
  rec_title_ph:   { en: "e.g. HbA1c blood test", ar: "مثال: تحليل السكر التراكمي" },
  rec_date:       { en: "Date",                 ar: "التاريخ"                },
  rec_attach:     { en: "Attach file or photo",  ar: "إرفاق ملف أو صورة"       },
  rec_attach_h:   { en: "PDF, photo of a paper report, or a scan image.", ar: "ملف PDF أو صورة لتقرير ورقي أو صورة أشعة." },
  rec_take_photo: { en: "Take a photo",         ar: "التقاط صورة"            },
  rec_from_files: { en: "Choose a file",        ar: "اختيار ملف"             },
  rec_added:      { en: "Record added",         ar: "تمت إضافة السجل"        },
  rec_added_h:    { en: "Stored on your device. Yours by design.", ar: "محفوظ على جهازك. ملكك بالتصميم." },
  rec_empty:      { en: "No records yet",       ar: "لا توجد سجلات بعد"       },
  rec_empty_h:    { en: "Add a lab test, scan, or report to keep your whole history in one place.", ar: "أضف تحليلاً أو أشعة أو تقريراً لتحتفظ بتاريخك كاملاً في مكان واحد." },
  rec_source:     { en: "Source",               ar: "المصدر"                 },
  rec_view:       { en: "View document",        ar: "عرض المستند"            },
  rec_share:      { en: "Share with doctor",    ar: "مشاركة مع الطبيب"        },
  /* ── strings ──────────────────────────────── */
  store_manage:    { en: 'Manage storage',      ar: 'إدارة التخزين'            },
  store_backup_now:{ en: 'Back up now',         ar: 'نسخ احتياطي الآن'         },
  store_backup_to: { en: 'Back up to',          ar: 'نسخ إلى'                  },
  store_remove_cloud:{ en: 'Remove from cloud', ar: 'حذف من السحابة'           },
  store_remove_dev:{ en: 'Remove from device',  ar: 'حذف من الجهاز'            },
  store_remove_dev_h:{ en: 'The file will remain in the cloud. You can download it again later.', ar: 'سيبقى الملف في السحابة ويمكنك تنزيله لاحقاً.' },
  store_delete_all:{ en: 'Delete everywhere',   ar: 'حذف من كل مكان'           },
  store_delete_all_h:{ en: 'This will permanently delete the record from this device and all connected cloud services.', ar: 'سيُحذف السجل نهائياً من الجهاز وجميع الخدمات السحابية المرتبطة.' },
  store_delete_rec:{ en: 'Delete record',       ar: 'حذف السجل'               },
  store_move_to:   { en: 'Move to',             ar: 'نقل إلى'                  },
  store_removed_cloud:{ en: 'Removed from cloud — now local only', ar: 'تمت إزالته من السحابة — محلي فقط الآن' },
  store_removed_dev:  { en: 'Removed from device — lives in cloud', ar: 'تمت إزالته من الجهاز — موجود في السحابة' },
  store_backed_up:    { en: 'Backed up successfully', ar: 'تم النسخ الاحتياطي بنجاح' },
  confirm_delete:     { en: 'Delete?',          ar: 'حذف؟'                    },
  cancel:             { en: 'Cancel',           ar: 'إلغاء'                   },

  /* ── Storage & sync ────────────────────────── */
  storage:        { en: "Storage & sync",       ar: "التخزين والمزامنة"        },
  storage_short:  { en: "Storage",              ar: "التخزين"                 },
  store_local:    { en: "On this device",       ar: "على هذا الجهاز"           },
  store_icloud:   { en: "iCloud",               ar: "آي كلاود"                },
  store_gdrive:   { en: "Google Drive",         ar: "جوجل درايف"              },
  store_primary:  { en: "Primary backup",       ar: "النسخة الاحتياطية الرئيسية" },
  store_connect:  { en: "Connect",              ar: "ربط"                     },
  store_connected:{ en: "Connected",            ar: "مرتبط"                   },
  store_disconnect:{ en: "Disconnect",          ar: "قطع الربط"               },
  store_set_primary:{ en: "Set as primary",     ar: "تعيين كرئيسي"            },
  store_usage:    { en: "Storage used",         ar: "المساحة المستخدمة"        },
  store_help:     { en: "Your data is always saved locally first. Connect a cloud service to back it up automatically.", ar: "تُحفظ بياناتك دائماً على الجهاز أولاً. اربط خدمة سحابية للنسخ الاحتياطي التلقائي." },
  store_breakdown:{ en: "Breakdown",            ar: "التفاصيل"                },
  store_checkins: { en: "Daily check-ins",      ar: "المتابعات اليومية"        },
  store_records:  { en: "Health records",       ar: "السجلات الصحية"           },
  store_rx:       { en: "Prescriptions",        ar: "الوصفات الطبية"           },
  store_of:       { en: "of",                   ar: "من"                      },
  store_syncing:  { en: "Syncing…",             ar: "جارٍ المزامنة…"           },
  store_synced:   { en: "Synced",               ar: "تمت المزامنة"             },
  store_local_only:{ en: "Local only",          ar: "محلي فقط"                },
  store_backed:   { en: "Backed up",            ar: "محفوظ احتياطياً"          },
  store_never:    { en: "Never backed up",      ar: "لم يُنسخ احتياطياً"       },
  store_last:     { en: "Last sync",            ar: "آخر مزامنة"              },

  /* ── Nearby care / map ────────────────────── */
  map_nearby:    { en: 'Nearby care',               ar: 'رعاية قريبة'               },
  map_search_ph: { en: 'Search clinics, pharmacies…', ar: 'ابحث عن عيادة أو صيدلية…'  },
  map_all:       { en: 'All',                       ar: 'الكل'                      },
  map_open_now:  { en: 'Open now',                  ar: 'مفتوح الآن'                },
  map_distance:  { en: 'away',                      ar: 'بُعد'                      },
  map_call:      { en: 'Call',                      ar: 'اتصال'                     },
  map_directions:{ en: 'Directions',                ar: 'اتجاهات'                   },
  map_list:      { en: 'List',                      ar: 'قائمة'                     },
  map_map:       { en: 'Map',                       ar: 'خريطة'                     },
  map_found:     { en: 'places nearby',             ar: 'مكان بالقرب منك'           },
  map_your_loc:  { en: 'Your location',             ar: 'موقعك'                     },
  map_no_results:{ en: 'No places found',           ar: 'لا توجد أماكن'             },
  map_no_res_h:  { en: 'Try a different filter or search term.', ar: 'جرّب تصفية مختلفة أو مصطلح بحث آخر.' },
};

/* ── Health-entity catalogue ─────────────────────────────── */
const ENTITY_TYPES = {
  hospital: { icon:'building-2',    color:'#D44A3C', bg:'#FAEAE8', border:'#F0C4C0', label:{en:'Hospitals',     ar:'مستشفيات'   } },
  clinic:   { icon:'stethoscope',   color:'#1283FF', bg:'#E4F0FF', border:'#B8D4FF', label:{en:'Clinics',       ar:'عيادات'      } },
  pharmacy: { icon:'pill',          color:'#01C4A2', bg:'#E1F8F1', border:'#A8ECD8', label:{en:'Pharmacies',    ar:'صيدليات'     } },
  lab:      { icon:'flask-conical', color:'#724DD0', bg:'#ECE6FA', border:'#C8B8F0', label:{en:'Labs',          ar:'مختبرات'     } },
  scan:     { icon:'scan-line',     color:'#02BBB5', bg:'#E2F8F6', border:'#A0E8E4', label:{en:'Scan centers',  ar:'مراكز أشعة'  } },
  store:    { icon:'shopping-bag',  color:'#D97A20', bg:'#FDF0E0', border:'#F0CCAA', label:{en:'Med. stores',   ar:'أدوات طبية'  } },
};

const HEALTH_ENTITIES = [
  { id:'e1',  type:'hospital', x:72,  y:210, name:{en:'Qasr Al-Aini Hospital',          ar:'مستشفى قصر العيني'           }, addr:{en:'Al-Kasr Al-Aini St, Cairo',ar:'شارع قصر العيني، القاهرة'  }, hours:'24/7',       distance:'0.8 km', rating:'4.2', phone:'+20 2 2365 1234' },
  { id:'e2',  type:'clinic',   x:210, y:105, name:{en:'Dr. Sara Kamal Clinic',           ar:'عيادة د. سارة كمال'           }, addr:{en:'Zamalek, Cairo',          ar:'الزمالك، القاهرة'          }, hours:'9am – 5pm',  distance:'1.2 km', rating:'4.9', phone:'+20 10 9876 5432' },
  { id:'e3',  type:'pharmacy', x:295, y:230, name:{en:'El-Ezaby Pharmacy',               ar:'صيدلية العزبي'                }, addr:{en:'Tahrir Sq, Cairo',        ar:'ميدان التحرير، القاهرة'    }, hours:'8am – 12am', distance:'0.4 km', rating:'4.5', phone:'+20 2 2574 3210' },
  { id:'e4',  type:'lab',      x:110, y:310, name:{en:'Alfa Scan Lab',                   ar:'مختبر ألفا سكان'              }, addr:{en:'Garden City, Cairo',      ar:'جاردن سيتي، القاهرة'       }, hours:'7am – 9pm',  distance:'1.5 km', rating:'4.7', phone:'+20 2 2795 6789' },
  { id:'e5',  type:'scan',     x:332, y:148, name:{en:'Cairo Radiology Center',          ar:'مركز القاهرة للأشعة'          }, addr:{en:'Mohandiseen, Giza',       ar:'المهندسين، الجيزة'         }, hours:'8am – 10pm', distance:'2.1 km', rating:'4.6', phone:'+20 2 3304 5678' },
  { id:'e6',  type:'store',    x:265, y:358, name:{en:'Al-Hayat Medical Supplies',       ar:'الحياة للمستلزمات الطبية'     }, addr:{en:'Dokki, Giza',             ar:'الدقي، الجيزة'             }, hours:'9am – 8pm',  distance:'1.8 km', rating:'4.3', phone:'+20 2 3761 2345' },
  { id:'e7',  type:'pharmacy', x:100, y:148, name:{en:'Seif Pharmacy',                   ar:'صيدلية سيف'                   }, addr:{en:'Agouza, Giza',            ar:'العجوزة، الجيزة'           }, hours:'24/7',       distance:'0.9 km', rating:'4.4', phone:'+20 2 3748 9012' },
  { id:'e8',  type:'clinic',   x:342, y:302, name:{en:'Capital Clinic',                  ar:'عيادة كابيتال'                }, addr:{en:'Nasr City, Cairo',        ar:'مدينة نصر، القاهرة'        }, hours:'10am – 6pm', distance:'3.2 km', rating:'4.1', phone:'+20 2 2402 3456' },
  { id:'e9',  type:'hospital', x:180, y:378, name:{en:'Ain Shams Specialized Hospital',  ar:'مستشفى عين شمس التخصصي'       }, addr:{en:'Ain Shams, Cairo',        ar:'عين شمس، القاهرة'          }, hours:'24/7',       distance:'4.1 km', rating:'4.3', phone:'+20 2 2601 7890' },
  { id:'e10', type:'lab',      x:358, y:80,  name:{en:'Cairo Lab',                       ar:'كايرو لاب'                    }, addr:{en:'Heliopolis, Cairo',       ar:'مصر الجديدة، القاهرة'      }, hours:'7am – 11pm', distance:'5.0 km', rating:'4.8', phone:'+20 2 2690 1234' },
  { id:'e11', type:'scan',     x:52,  y:108, name:{en:'Green Crescent Scan Center',      ar:'مركز الهلال الأخضر للأشعة'    }, addr:{en:'Mohandeseen, Giza',       ar:'المهندسين، الجيزة'         }, hours:'8am – 8pm',  distance:'2.8 km', rating:'4.5', phone:'+20 2 3303 1234' },
  { id:'e12', type:'store',    x:158, y:62,  name:{en:'MedLine Medical Supplies',        ar:'ميدلاين للمستلزمات الطبية'    }, addr:{en:'Zamalek, Cairo',          ar:'الزمالك، القاهرة'          }, hours:'9am – 7pm',  distance:'1.4 km', rating:'4.2', phone:'+20 2 2736 5678' },
];

Object.assign(window, {
  STR, PATIENT, MEDS, GOVERNORATES, MOOD_COLORS,
  HISTORY, TREND_BP_SYS, TREND_BP_DIA, TREND_GLU,
  DOCTORS, APPOINTMENTS, PRESCRIPTIONS, FAMILY_ACCOUNTS,
  LANGUAGES, COUNTRIES, RECORD_TYPES, HEALTH_RECORDS,
  ENTITY_TYPES, HEALTH_ENTITIES,
});
/* sentinel: END OF DATA */

/* ── Sample patient ──────────────────────────────────────── */
const PATIENT = {
  name:       { en: "Layla Hassan", ar: "ليلى حسن" },
  firstName:  { en: "Layla",  ar: "ليلى"  },
  lastName:   { en: "Hassan", ar: "حسن"   },
  initials:   "LH",
  phone:      "+20 10 1234 5678",
  dob:        { en: "14/03/1967", ar: "14/03/1967" },
  gender:     "female",
  nid:        "2 6703 14 12345 6",
  bloodType:  "B+",
  weight:     78,
  height:     162,
  emergency:  { name: "Ahmed Hassan", relation: { en: "Son", ar: "ابن" }, phone: "+20 10 9876 5432" },
  age:        58,
  since:      { en: "Mar 2025", ar: "مارس 2025" },
  conditions: [
    { en: "Type 2 diabetes",  ar: "السكري من النوع الثاني" },
    { en: "Hypertension",     ar: "ارتفاع ضغط الدم" },
  ],
};

/* ── Medications (chronic regimen) ──────────────────────── */
const MEDS = [
  { id: "metformin",   name: { en: "Metformin",   ar: "ميتفورمين"   }, dose: { en: "500 mg · with breakfast",  ar: "500 ملجم · مع الإفطار"   }, when: "morning", tone: "info",    icon: "pill"        },
  { id: "amlodipine",  name: { en: "Amlodipine",  ar: "أملوديبين"   }, dose: { en: "5 mg · once daily",        ar: "5 ملجم · مرة يومياً"      }, when: "morning", tone: "violet",  icon: "heart-pulse" },
  { id: "atorvastatin",name: { en: "Atorvastatin",ar: "أتورفاستاتين"}, dose: { en: "20 mg · after dinner",     ar: "20 ملجم · بعد العشاء"     }, when: "evening", tone: "success", icon: "pill"        },
];

/* ── Egyptian governorates ───────────────────────────────── */
const GOVERNORATES = [
  { en: "Cairo",      ar: "القاهرة"     }, { en: "Giza",       ar: "الجيزة"    },
  { en: "Alexandria", ar: "الإسكندرية"  }, { en: "Dakahlia",   ar: "الدقهلية"  },
  { en: "Sharqia",    ar: "الشرقية"     }, { en: "Qalyubia",   ar: "القليوبية" },
  { en: "Gharbia",    ar: "الغربية"     }, { en: "Beheira",    ar: "البحيرة"   },
  { en: "Menoufia",   ar: "المنوفية"    }, { en: "Aswan",      ar: "أسوان"     },
  { en: "Luxor",      ar: "الأقصر"      }, { en: "Port Said",  ar: "بورسعيد"   },
];

/* ── Mood colors (sad → great) ───────────────────────────── */
const MOOD_COLORS = ["#D44A3C","#D97A20","#E5B428","#55D77F","#01C4A2"];

/* ── History (most recent first) ─────────────────────────── */
const HISTORY = [
  { d: 28, m: { en: "MAY", ar: "مايو" }, bp: "128/82", glu: 142, mood: 4, pain: 1, sym: 0 },
  { d: 27, m: { en: "MAY", ar: "مايو" }, bp: "134/86", glu: 156, mood: 3, pain: 3, sym: 1 },
  { d: 26, m: { en: "MAY", ar: "مايو" }, bp: "131/84", glu: 138, mood: 4, pain: 0, sym: 0 },
  { d: 25, m: { en: "MAY", ar: "مايو" }, bp: "126/80", glu: 129, mood: 5, pain: 0, sym: 0 },
  { d: 24, m: { en: "MAY", ar: "مايو" }, bp: "139/88", glu: 167, mood: 2, pain: 4, sym: 2 },
  { d: 23, m: { en: "MAY", ar: "مايو" }, bp: "130/83", glu: 145, mood: 3, pain: 2, sym: 0 },
];

/* ── Trend series ────────────────────────────────────────── */
const TREND_BP_SYS = [126, 139, 130, 134, 131, 128, 127];
const TREND_BP_DIA = [80, 88, 83, 86, 84, 82, 81];
const TREND_GLU    = [129, 167, 145, 156, 138, 142, 134];

/* ── Doctors ─────────────────────────────────────────────── */
const DOCTORS = [
  { id: 'sara',  name: { en: 'Dr. Sara Kamal', ar: 'د. سارة كمال'  }, specialty: { en: 'Internal Medicine', ar: 'الباطنة'       }, initials: 'SK', color: 'var(--hue-aqua)',    rating: '4.9', experience: { en: '12 yrs', ar: '١٢ سنة'  } },
  { id: 'ahmed', name: { en: 'Dr. Ahmed Nour',  ar: 'د. أحمد نور'  }, specialty: { en: 'Cardiology',        ar: 'أمراض القلب'  }, initials: 'AN', color: 'var(--hue-blue)',    rating: '4.8', experience: { en: '9 yrs',  ar: '٩ سنوات' } },
  { id: 'mona',  name: { en: 'Dr. Mona Saad',   ar: 'د. منى سعد'   }, specialty: { en: 'Endocrinology',    ar: 'الغدد الصماء' }, initials: 'MS', color: 'var(--hue-emerald)', rating: '4.9', experience: { en: '15 yrs', ar: '١٥ سنة'  } },
];

/* ── Appointments ────────────────────────────────────────── */
const APPOINTMENTS = [
  { id: 'a1', doctorId: 'sara',  type: 'follow-up', date: { en: 'Sun, 8 Jun',   ar: 'الأحد، 8 يونيو'     }, time: '10:30', location: { en: 'Cairo Medical Center · Rm 204', ar: 'المركز الطبي القاهرة · غرفة 204' }, status: 'upcoming', ref: 'BL-24819' },
  { id: 'a2', doctorId: 'ahmed', type: 'check-up',  date: { en: 'Mon, 26 May',  ar: 'الإثنين، 26 مايو'   }, time: '09:00', location: { en: 'Heart Care Clinic',             ar: 'عيادة القلب'                   }, status: 'past',     ref: 'BL-24102' },
  { id: 'a3', doctorId: 'sara',  type: 'follow-up', date: { en: 'Wed, 12 Mar',  ar: 'الأربعاء، 12 مارس'  }, time: '11:00', location: { en: 'Cairo Medical Center · Rm 204', ar: 'المركز الطبي القاهرة · غرفة 204' }, status: 'past',     ref: 'BL-23658' },
];

/* ── Prescriptions ───────────────────────────────────────── */
const PRESCRIPTIONS = [
  { id: 'rx1', doctorId: 'sara',  date: { en: '26 May 2025', ar: '26 مايو 2025'  }, validUntil: { en: '26 Aug 2025', ar: '26 أغسطس 2025' }, status: 'active', ref: 'RX-20250526-001',
    meds: [
      { name: { en: 'Metformin',    ar: 'ميتفورمين'    }, dose: { en: '500 mg · twice daily', ar: '500 ملجم · مرتين يومياً' } },
      { name: { en: 'Amlodipine',   ar: 'أملوديبين'   }, dose: { en: '5 mg · once daily',    ar: '5 ملجم · مرة يومياً'     } },
      { name: { en: 'Atorvastatin', ar: 'أتورفاستاتين'}, dose: { en: '20 mg · at night',     ar: '20 ملجم · ليلاً'         } },
    ]},
  { id: 'rx2', doctorId: 'ahmed', date: { en: '26 May 2025', ar: '26 مايو 2025'  }, validUntil: { en: '26 Jun 2025', ar: '26 يونيو 2025'  }, status: 'active', ref: 'RX-20250526-002',
    meds: [
      { name: { en: 'Aspirin',     ar: 'أسبرين'    }, dose: { en: '100 mg · once daily', ar: '100 ملجم · مرة يومياً' } },
      { name: { en: 'Bisoprolol',  ar: 'بيسوبرولول'}, dose: { en: '5 mg · once daily',   ar: '5 ملجم · مرة يومياً'   } },
    ]},
  { id: 'rx3', doctorId: 'sara',  date: { en: '12 Mar 2025', ar: '12 مارس 2025'  }, validUntil: { en: '12 Jun 2025', ar: '12 يونيو 2025'  }, status: 'expired', ref: 'RX-20250312-001',
    meds: [
      { name: { en: 'Metformin', ar: 'ميتفورمين' }, dose: { en: '500 mg · once daily', ar: '500 ملجم · مرة يومياً' } },
    ]},
];

/* ── Family accounts ────────────────────────────────────── */
const FAMILY_ACCOUNTS = [
  { id: 'layla', name: { en: 'Layla Hassan', ar: 'ليلى حسن'  }, initials: 'LH', color: 'var(--hue-aqua)',   relation: { en: 'You',      ar: 'أنتِ'   }, age: 58, since: { en: 'Mar 2025', ar: 'مارس 2025'  }, conditions: [{ en: 'Type 2 diabetes', ar: 'السكري من النوع الثاني' }, { en: 'Hypertension', ar: 'ارتفاع ضغط الدم' }] },
  { id: 'karim', name: { en: 'Karim Hassan', ar: 'كريم حسن'  }, initials: 'KH', color: 'var(--hue-blue)',   relation: { en: 'Husband',  ar: 'الزوج'  }, age: 63, since: { en: 'Mar 2025', ar: 'مارس 2025'  }, conditions: [{ en: 'Hypertension', ar: 'ارتفاع ضغط الدم' }] },
  { id: 'nadia', name: { en: 'Nadia Hassan', ar: 'ناديا حسن' }, initials: 'NH', color: 'var(--hue-violet)', relation: { en: 'Daughter', ar: 'الابنة' }, age: 28, since: { en: 'Apr 2025', ar: 'أبريل 2025' }, conditions: [] },
];

/* ── Languages (en + ar fully translated; others preview) ─ */
const LANGUAGES = [
  { code: 'ar', native: 'العربية',   en: 'Arabic',   rtl: true,  full: true  },
  { code: 'en', native: 'English',   en: 'English',  rtl: false, full: true  },
  { code: 'fr', native: 'Français',  en: 'French',   rtl: false, full: false },
  { code: 'ur', native: 'اردو',      en: 'Urdu',     rtl: true,  full: false },
  { code: 'fa', native: 'فارسی',     en: 'Persian',  rtl: true,  full: false },
  { code: 'tr', native: 'Türkçe',    en: 'Turkish',  rtl: false, full: false },
];

/* ── Countries (travel mode) ─────────────────────────────── */
const COUNTRIES = [
  { code: 'EG', name: { en: 'Egypt',          ar: 'مصر'        }, dial: '+20',  emergency: '123', home: true  },
  { code: 'SA', name: { en: 'Saudi Arabia',   ar: 'السعودية'   }, dial: '+966', emergency: '997'              },
  { code: 'AE', name: { en: 'UAE',            ar: 'الإمارات'   }, dial: '+971', emergency: '998'              },
  { code: 'JO', name: { en: 'Jordan',         ar: 'الأردن'     }, dial: '+962', emergency: '911'              },
  { code: 'KW', name: { en: 'Kuwait',         ar: 'الكويت'     }, dial: '+965', emergency: '112'              },
  { code: 'QA', name: { en: 'Qatar',          ar: 'قطر'        }, dial: '+974', emergency: '999'              },
  { code: 'MA', name: { en: 'Morocco',        ar: 'المغرب'     }, dial: '+212', emergency: '150'              },
  { code: 'LB', name: { en: 'Lebanon',        ar: 'لبنان'      }, dial: '+961', emergency: '140'              },
];

/* ── Health records (labs / scans / reports) ─────────────── */
const RECORD_TYPES = {
  lab:    { icon: 'flask-conical', color: 'var(--hue-mint-600)', bg: 'var(--hue-mint-50)',   labelKey: 'rec_lab',    oneKey: 'rec_lab_one'    },
  scan:   { icon: 'scan-line',     color: 'var(--hue-blue)',     bg: 'var(--hue-blue-50)',   labelKey: 'rec_scan',   oneKey: 'rec_scan_one'   },
  report: { icon: 'file-text',     color: 'var(--hue-violet)',   bg: 'var(--hue-violet-50)', labelKey: 'rec_report', oneKey: 'rec_report_one' },
};

const HEALTH_RECORDS = [
  { id: 'r1', type: 'lab',    storage: 'icloud',  title: { en: 'HbA1c — glycated hemoglobin', ar: 'تحليل السكر التراكمي' }, date: { en: '26 May 2025', ar: '26 مايو 2025' }, sourceId: 'sara',  fileType: 'PDF',   pages: 2, result: { en: '6.8% · slightly above target', ar: '6.8% · أعلى قليلاً من الهدف' } },
  { id: 'r2', type: 'lab',    storage: 'icloud',  title: { en: 'Lipid panel',                 ar: 'تحليل الدهون' },          date: { en: '26 May 2025', ar: '26 مايو 2025' }, sourceId: 'sara',  fileType: 'PDF',   pages: 1, result: { en: 'LDL 128 · within range', ar: 'الكوليسترول الضار 128 · ضمن المعدل' } },
  { id: 'r3', type: 'scan',   storage: 'gdrive',  title: { en: 'Chest X-ray',                 ar: 'أشعة الصدر' },            date: { en: '12 Mar 2025', ar: '12 مارس 2025' }, sourceId: 'ahmed', fileType: 'Image', pages: 1, result: { en: 'No acute findings', ar: 'لا توجد ملاحظات حادة' } },
  { id: 'r4', type: 'report', storage: 'gdrive',  title: { en: 'Cardiology consultation',     ar: 'استشارة القلب' },         date: { en: '12 Mar 2025', ar: '12 مارس 2025' }, sourceId: 'ahmed', fileType: 'PDF',   pages: 3, result: null },
  { id: 'r5', type: 'lab',    storage: 'local',   title: { en: 'Fasting blood glucose',       ar: 'سكر الدم الصائم' },       date: { en: '02 Feb 2025', ar: '2 فبراير 2025' }, sourceId: 'self',  fileType: 'Image', pages: 1, result: { en: '132 mg/dL', ar: '132 مجم/دل' } },
];

Object.assign(window, {
  STR, PATIENT, MEDS, GOVERNORATES, MOOD_COLORS,
  HISTORY, TREND_BP_SYS, TREND_BP_DIA, TREND_GLU,
  DOCTORS, APPOINTMENTS, PRESCRIPTIONS, FAMILY_ACCOUNTS,
  LANGUAGES, COUNTRIES, RECORD_TYPES, HEALTH_RECORDS,
});
