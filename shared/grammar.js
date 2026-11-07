/* KOREAN TALK — Grammar Book. Shared by both courses (Student's Book and Workbook), same as SNU Korean+'s own
 * separate grammar booklet. Explanations are in Uzbek throughout — this app never explains in English.
 * Korean and Uzbek are both SOV (subject-object-verb) and agglutinative (endings stack onto a word stem), so word
 * order is NOT the hard part for an Uzbek speaker learning Korean, unlike for an English learner — every "common
 * mistake" below instead targets the things that really do differ: particles, honorific speech levels, and the
 * absence of articles/grammatical gender in both languages (so that is never an issue here either). */
const GRAMMAR = [

{id:"copula", cat:"Asosiy qoidalar", title:"이에요/예요 — \"bo'lmoq\" fe'li",
explain:[
"Koreys tilida otdan keyin '~이에요' yoki '~예요' qo'shilsa, bu o'zbekcha '-man/-san/-dir' kabi 'bo'lmoq' ma'nosini beradi: 저는 학생이에요 (Men talabaman).",
"Agar so'z undosh bilan tugasa — 이에요: 선생님이에요 (U o'qituvchi). Agar so'z unli bilan tugasa — 예요: 저예요 (Bu men).",
"O'zbek tilida ham 'man/san/dir' kabi qo'shimchalar otga qo'shiladi, shuning uchun bu qoida tanish bo'ladi — faqat koreyschada so'z oxiridagi harfga (undosh/unli) qarab ikki shakl bor."
],
examples:[["저는 압두자리포프예요.","Men Abdujalilovman."],["이것은 책이에요.","Bu kitob."],["선생님이에요?","U o'qituvchimi?"],["여기는 학교예요.","Bu yer maktab."],["저는 우즈베키스탄 사람이에요.","Men o'zbekistonlikman."]],
mistakeWrong:"책예요 (so'z undosh bilan tugaganda '예요' ishlatish)",
mistakeRight:"책이에요",
mistakeWhy:"Ko'p o'quvchilar 이에요/예요 ni tasodifiy tanlaydi. Qoida oddiy: oxirgi harf undosh (받침 bor) bo'lsa — 이에요, unli (받침 yo'q) bo'lsa — 예요.",
quiz:[
["'저는 학생___' ni to'ldiring ('student' undosh bilan tugaydi: 학생)",["예요","이에요","이다","예"],1],
["'이것은 커피___' ni to'ldiring (커피 — unli bilan tugaydi)",["이에요","예요","이다","있어요"],1],
["이에요/예요 o'zbekcha nimaga mos keladi?",["Kelishik qo'shimchasi","'bo'lmoq' fe'li (-man/-dir)","Ko'plik qo'shimchasi","Savol qo'shimchasi"],1],
["'선생님이에요' gapining ma'nosi:",["U talaba","U o'qituvchi","Bu kitob","Kechirasiz"],1]]},

{id:"demonstratives", cat:"Asosiy qoidalar", title:"이/그/저 — bu/shu/u",
explain:[
"이 — gapiruvchiga yaqin narsa ('bu'). 그 — tinglovchiga yaqin yoki ikkalasi bilgan narsa ('shu'). 저 — ikkalasidan uzoqda ko'rinib turgan narsa ('u, ana u').",
"Bu uch so'z yolg'iz holda ishlatilmaydi — doim otdan oldin keladi: 이 책 (bu kitob), 그 사람 (shu odam), 저 건물 (ana u bino).",
"Narsa nomini aytmay, faqat ko'rsatish uchun 이것/그것/저것 ('bu narsa/shu narsa/u narsa') ishlatiladi: 이것이 뭐예요? (Bu nima?)."
],
examples:[["이것은 제 가방이에요.","Bu mening sumkam."],["그 사람이 누구예요?","Shu odam kim?"],["저 건물이 학교예요.","Ana u bino — maktab."],["이 책이 재미있어요.","Bu kitob qiziqarli."],["그것 좀 주세요.","Shuni bering, iltimos."]],
mistakeWrong:"이것 책이에요 (ot bilan birga ishlatilganda 것 qo'shib bo'lmaydi)",
mistakeRight:"이 책이에요 / 이것이 책이에요",
mistakeWhy:"이/그/저 otdan OLDIN sifat kabi ishlatiladi (이 책), 이것/그것/저것 esa o'zi OT o'rnida ishlatiladi (이것이 책이에요). Ikkalasini aralashtirib yubormang.",
quiz:[
["Gapiruvchiga yaqin narsa uchun qaysi so'z ishlatiladi?",["그","저","이","그것"],2],
["'이것이 뭐예요?' gapining ma'nosi:",["Bu kim?","Bu nima?","U qayerda?","Nima qildingiz?"],1],
["Ikkala tomondan ham uzoqdagi narsa uchun:",["이","그","저","것"],2],
["To'g'ri jumlani tanlang:",["이것 가방이에요","이 가방이에요","가방 이것이에요","이에요 가방"],1]]},

{id:"particles", cat:"Asosiy qoidalar", title:"은/는 va 이/가 — mavzu va ega qo'shimchalari",
explain:[
"Koreys tilida ot o'zi gapda qanday vazifa bajarishiga qarab oxiriga qisqa qo'shimcha oladi — bu o'zbek tilidagi kelishik qo'shimchalariga juda o'xshaydi (kitob-NI, uy-DA kabi), shuning uchun bu tushuncha sizga begona emas.",
"은/는 — gap MAVZUSINI bildiradi ('...haqida aytsam'): 저는 학생이에요 (Men bo'lsam, talabaman). Undosh bilan tugagan so'zga 은, unli bilan tugaganga 는 qo'shiladi.",
"이/가 — gapning aniq EGASINI bildiradi, ko'pincha yangi yoki alohida urg'u berilgan ma'lumotda: 누가 왔어요? — 친구가 왔어요 (Kim keldi? — Do'stim keldi). Undoshga 이, unliga 가."
],
examples:[["저는 한국어를 배워요.","Men koreys tilini o'rganyapman."],["이름이 뭐예요?","Ismingiz nima?"],["오늘은 날씨가 좋아요.","Bugun (bo'lsa) ob-havo yaxshi."],["친구가 와요.","Do'stim kelyapti."],["저는 학생이고 친구는 회사원이에요.","Men talabaman, do'stim esa xodim."]],
mistakeWrong:"이름 뭐예요? (qo'shimchani umuman tashlab ketish)",
mistakeRight:"이름이 뭐예요?",
mistakeWhy:"O'zbek tilida ba'zan qo'shimchasiz ham tushunarli bo'ladi ('Ism nima?'), lekin koreys tilida bu qo'shimchalar deyarli har doim kerak — ularsiz gap notabiiy eshitiladi.",
quiz:[
["은/는 nimani bildiradi?",["Gap mavzusini","Gap oxirini","Ko'plikni","Savolni"],0],
["'친구___ 와요' (do'stim keladi, yangi xabar) — to'g'ri qo'shimcha:",["는","가","를","의"],1],
["Undosh bilan tugagan so'zga qaysi qo'shimcha qo'shiladi: 은 yoki 는?",["는","은","가","이"],1],
["'저는 학생이에요'dagi 는 nimani ko'rsatadi?",["Ega ekanini","Mavzu ekanini ('men bo'lsam')","Kelishikni","Savol ekanini"],1]]},

{id:"existence", cat:"Asosiy qoidalar", title:"있어요/없어요 — bor/yo'q",
explain:[
"있어요 — biror narsa yoki kishi mavjudligini ('bor') yoki qayerdaligini bildiradi. 없어요 — mavjud emasligini ('yo'q') bildiradi.",
"Qayerdaligini aytish uchun joy nomidan keyin 에 qo'shimchasi, so'ng 있어요/없어요 keladi: 가방이 책상 위에 있어요 (Sumka stol ustida bor/turibdi).",
"Bu fe'l ham egalik ma'nosida ishlatiladi: 저는 시간이 없어요 (Mening vaqtim yo'q) — so'zma-so'z 'Men uchun vaqt yo'q'."
],
examples:[["화장실이 어디에 있어요?","Hojatxona qayerda?"],["교실에 학생이 있어요.","Sinfda talaba bor."],["저는 돈이 없어요.","Mening pulim yo'q."],["책상 위에 책이 있어요.","Stol ustida kitob bor."],["여기에 커피숍이 없어요.","Bu yerda kofexona yo'q."]],
mistakeWrong:"저는 돈이 안 있어요 (안 bilan inkor qilish)",
mistakeRight:"저는 돈이 없어요",
mistakeWhy:"Ko'pchilik fe'llar 안 bilan inkor qilinadi (가요 → 안 가요), lekin 있어요 ning o'zining alohida inkor shakli bor: 없어요. 안 있어요 deb bo'lmaydi.",
quiz:[
["'저는 시간이 없어요' gapining ma'nosi:",["Mening vaqtim bor","Mening vaqtim yo'q","Men vaqtni bilmayman","Men band emasman"],1],
["있어요 ning inkor shakli:",["안 있어요","있지 않아요","없어요","있어요 안"],2],
["'화장실이 어디___ 있어요?' bo'sh joyni to'ldiring",["를","에","은","가"],1],
["있어요 qaysi ma'noni BERMAYDI?",["Mavjudlik (bor)","Joylashuv (turibdi)","Egalik (bor, ega)","Harakat (bormoq)"],3]]},

{id:"present-tense", cat:"Fe'l zamonlari", title:"-아요/어요 — hozirgi zamon",
explain:[
"Koreys fe'llari lug'at shaklida -다 bilan tugaydi (가다 — bormoq), lekin gapda ishlatish uchun bu oxirgi qism -아요/어요 bilan almashtiriladi.",
"Fe'l tanasining oxirgi unlisi ㅏ yoki ㅗ bo'lsa — -아요 qo'shiladi (가다 → 가요). Boshqa barcha hollarda — -어요 (먹다 → 먹어요, 마시다 → 마셔요).",
"Bu shakl 'odatiy harakat', 'hozir bo'layotgan harakat' va 'hurmatli, neytral uslub'da gapirish uchun ishlatiladi — kundalik suhbatda eng ko'p qo'llaniladigan shakl shu."
],
examples:[["저는 매일 학교에 가요.","Men har kuni maktabga boraman."],["지금 밥을 먹어요.","Hozir ovqat yeyapman."],["무엇을 마셔요?","Nima ichyapsiz?"],["한국어를 공부해요.","Koreys tilini o'rganyapman."],["친구를 만나요.","Do'stim bilan uchrashyapman."]],
mistakeWrong:"가다요 (lug'at shaklini -요 bilan to'g'ridan-to'g'ri birlashtirish)",
mistakeRight:"가요",
mistakeWhy:"-다 ni olib tashlab, fe'l tanasiga unliga qarab -아요 yoki -어요 qo'shish kerak — -다 ning o'ziga -요 qo'shib bo'lmaydi.",
quiz:[
["가다 (bormoq) ning -아요/어요 shakli:",["가어요","가다요","가요","갑니다"],2],
["먹다 (yemoq) fe'li uchun qaysi qo'shimcha to'g'ri?",["-아요","-어요","-여요","-다요"],1],
["-아요/어요 qachon ishlatiladi?",["Faqat kelasi zamonda","Hozirgi/odatiy harakatda, hurmatli uslubda","Faqat o'tgan zamonda","Faqat buyruqda"],1],
["공부하다 (o'qimoq) ning to'g'ri shakli:",["공부해요","공부하요","공부아요","공부다요"],0]]},

{id:"past-tense", cat:"Fe'l zamonlari", title:"-았/었어요 — o'tgan zamon",
explain:[
"O'tgan zamon -아요/어요 bilan bir xil qoida bo'yicha yasaladi, faqat -아요/어요 o'rniga -았어요/었어요 qo'shiladi: 가다 → 갔어요 (bordim/bordi), 먹다 → 먹었어요 (yedim/yedi).",
"Fe'l tanasi ㅏ yoki ㅗ bilan tugasa — -았어요, boshqa holda — -었어요. 하다 bilan tugaydigan fe'llar esa -했어요 bo'ladi (공부하다 → 공부했어요).",
"O'zbek tilida ham fe'l o'zagiga qo'shimcha qo'shib o'tgan zamon yasaladi (bor-DI, yе-DI), shuning uchun mantiq tanish — faqat koreyscha qo'shimchaning shakli unliga qarab o'zgaradi."
],
examples:[["어제 친구를 만났어요.","Kecha do'stim bilan uchrashdim."],["아침에 밥을 먹었어요.","Ertalab ovqat yedim."],["지난주에 한국에 갔어요.","O'tgan hafta Koreyaga bordim."],["어제 비가 왔어요.","Kecha yomg'ir yog'di."],["주말에 집에서 쉬었어요.","Dam olish kunlari uyda dam oldim."]],
mistakeWrong:"어제 가요 (o'tgan zamon ma'nosini hozirgi zamon shakli bilan berish)",
mistakeRight:"어제 갔어요",
mistakeWhy:"O'zbek tilida ham 'kecha boraman' emas, 'kecha bordim' deyiladi — xuddi shunday koreys tilida ham '어제' (kecha) so'zi bo'lsa, fe'l albatta o'tgan zamon shaklida (-았/었어요) bo'lishi kerak.",
quiz:[
["가다 ning o'tgan zamon shakli:",["가요","갔어요","가어요","간어요"],1],
["공부하다 ning o'tgan zamon shakli:",["공부았어요","공부해요","공부했어요","공부다었어요"],2],
["'어제 비가 ___' bo'sh joyni to'ldiring (yomg'ir yog'di)",["와요","왔어요","오어요","오았어요"],1],
["O'tgan zamon qo'shimchasi qaysilar?",["-아요/어요","-았어요/었어요","-(으)ㄹ 거예요","-고 있어요"],1]]},

{id:"future-tense", cat:"Fe'l zamonlari", title:"-(으)ㄹ 거예요 — kelasi zamon / reja",
explain:[
"Kelajakdagi reja yoki taxminni aytish uchun fe'l tanasiga -(으)ㄹ 거예요 qo'shiladi: 가다 → 갈 거예요 (boraman/boradi).",
"Fe'l tanasi undosh bilan tugasa — -을 거예요 (먹다 → 먹을 거예요), unli yoki ㄹ bilan tugasa — -ㄹ 거예요 (가다 → 갈 거예요).",
"Bu shakl ham o'z rejangiz ('주말에 쉴 거예요' — Dam olish kunlari dam olaman), ham taxmin ('내일 비가 올 거예요' — Ertaga yomg'ir yog'adi) uchun ishlatiladi."
],
examples:[["내일 친구를 만날 거예요.","Ertaga do'stim bilan uchrashaman."],["주말에 집에서 쉴 거예요.","Dam olish kunlari uyda dam olaman."],["저녁에 밥을 먹을 거예요.","Kechqurun ovqat yeyman."],["다음 주에 여행을 갈 거예요.","Keyingi hafta sayohatga boraman."],["내일 비가 올 거예요.","Ertaga yomg'ir yog'adi (taxmin)."]],
mistakeWrong:"내일 가요 거예요 (ikki fe'l shaklini birlashtirish)",
mistakeRight:"내일 갈 거예요",
mistakeWhy:"-(으)ㄹ 거예요 to'g'ridan-to'g'ri fe'l TANASIGA (가-, 먹-) qo'shiladi, -아요/어요 shakliga emas. Avval -다 ni olib tashlang, keyin -(으)ㄹ 거예요 qo'shing.",
quiz:[
["먹다 (undosh bilan tugaydi) ning kelasi zamon shakli:",["먹ㄹ 거예요","먹을 거예요","먹어 거예요","먹다 거예요"],1],
["가다 (unli bilan tugaydi) ning kelasi zamon shakli:",["가을 거예요","갈 거예요","가ㄹ을 거예요","가다 거예요"],1],
["-(으)ㄹ 거예요 nima uchun ishlatiladi?",["Faqat o'tgan voqea","Reja yoki taxmin (kelajak)","Hozirgi harakat","Buyruq berish"],1],
["'내일 비가 올 거예요' gapining ma'nosi:",["Kecha yomg'ir yog'di","Hozir yomg'ir yog'yapti","Ertaga yomg'ir yog'adi","Yomg'ir yo'q"],2]]},

{id:"counters", cat:"Sanoq va o'lchov", title:"Koreyscha va sof koreyscha sonlar + sanoq so'zlari",
explain:[
"Koreys tilida IKKI xil son tizimi bor: xitoycha asosli (일, 이, 삼...) — sana, pul, telefon raqami uchun; sof koreyscha (하나, 둘, 셋...) — yosh va narsalarni sanashda (명, 개 kabi sanoq so'zlari bilan birga).",
"Odamlarni sanashda: sof koreyscha son + 명 (한 명, 두 명, 세 명...). E'tibor bering: 하나, 둘, 셋, 넷 sanoq so'zidan oldin 한, 두, 세, 네 shakliga o'zgaradi.",
"Narsalarni sanashda: sof koreyscha son + 개 (한 개, 두 개, 세 개...). Pul va narx uchun esa doim xitoycha asosli sonlar ishlatiladi: 천 원 (1000 von)."
],
examples:[["가족이 몇 명이에요?","Oilangizda necha kishi bor?"],["세 명이에요.","Uch kishi."],["사과 두 개 주세요.","Ikkita olma bering."],["이것은 오천 원이에요.","Bu besh ming von."],["저는 스물다섯 살이에요.","Men yigirma besh yoshdaman."]],
mistakeWrong:"삼 명이에요 (odam sanashda xitoycha son ishlatish)",
mistakeRight:"세 명이에요",
mistakeWhy:"Pul va sana uchun xitoycha sonlar (일, 이, 삼) to'g'ri, lekin odam yoki narsa sanashda (명, 개, 살 bilan) sof koreyscha sonlar (하나→한, 둘→두, 셋→세) ishlatiladi.",
quiz:[
["'Uch kishi' koreyschada qanday aytiladi?",["삼 명","세 명","셋 명","삼명이에요"],1],
["Pul miqdorini aytishda qaysi son tizimi ishlatiladi?",["Sof koreyscha (하나, 둘)","Xitoycha asosli (일, 이, 삼)","Ikkalasi ham","Hech qaysi birisi"],1],
["'하나' sanoq so'zidan oldin qanday o'zgaradi?",["하나 bo'lib qoladi","한 bo'ladi","일 bo'ladi","둘 bo'ladi"],1],
["'사과 두 개 주세요' gapining ma'nosi:",["Bitta olma bering","Ikkita olma bering","Olma yo'q","Olma qancha turadi?"],1]]},

{id:"restaurant", cat:"Bog'lovchilar", title:"N하고 N — ...va... (narsalarni bog'lash)",
explain:[
"Ikki ot o'rtasida 'va' ma'nosini berish uchun 하고 ishlatiladi: 비빔밥하고 불고기 (bibimbap va bulgogi). So'zlashuv tilida eng ko'p ishlatiladigan bog'lovchi shu.",
"하고 yana 'bilan birga' ma'nosida ham ishlatiladi: 친구하고 가요 (do'stim bilan boraman). Qaysi ma'noda ekanligini gap mazmunidan bilib olish mumkin.",
"Yozma tilda yoki rasmiyroq nutqda 와/과 ham ishlatiladi (unli bilan tugasa 와, undosh bilan tugasa 과), lekin kundalik suhbatda 하고 ko'proq ishlatiladi."
],
examples:[["비빔밥하고 불고기 주세요.","Bibimbap va bulgogi bering."],["친구하고 영화를 봤어요.","Do'stim bilan kino ko'rdim."],["커피하고 차가 있어요.","Qahva va choy bor."],["저는 언니하고 살아요.","Men opam bilan yashayman."],["사과하고 바나나를 샀어요.","Olma va banan sotib oldim."]],
mistakeWrong:"비빔밥 불고기 주세요 (bog'lovchisiz ikki otni ketma-ket qo'yish)",
mistakeRight:"비빔밥하고 불고기 주세요",
mistakeWhy:"O'zbek tilida ham 'bibimbap, bulgogi' deb vergul bilan sanab bo'lmaydi — 'va' kerak. Koreyschada ham xuddi shunday, 하고 albatta kerak.",
quiz:[
["'비빔밥하고 불고기' nechta taomni bog'laydi?",["Bitta","Ikkita","Uchta","Hech qaysi"],1],
["하고 yana qanday ma'noda ishlatiladi?",["Lekin","Bilan birga","Yoki","Chunki"],1],
["Yozma tilda 하고 o'rniga nima ishlatiladi?",["도","와/과","은/는","를"],1],
["'친구하고 가요' gapining ma'nosi:",["Do'stim ketdi","Do'stim bilan boraman","Do'stimga boraman","Do'stimsiz boraman"],1]]},

{id:"dates", cat:"Vaqt ifodalari", title:"요일 + 에 — hafta kuni + vaqt qo'shimchasi",
explain:[
"Yetti kunning har biriga 요일 qo'shib hosil qilinadi: 월요일 (dushanba), 화요일 (seshanba), 수요일 (chorshanba), 목요일 (payshanba), 금요일 (juma), 토요일 (shanba), 일요일 (yakshanba).",
"Hafta kuniga ham, boshqa aniq vaqt so'zlariga o'xshab, 에 qo'shimchasi qo'shiladi: 월요일에 (dushanba kuni), 토요일에 (shanba kuni).",
"Oy va sana uchun ham xuddi shunday 에 ishlatiladi: 삼월에 (mart oyida), 오일에 (beshinchi kuni). Faqat 오늘/내일/어제 kabi so'zlarga 에 qo'shilmaydi."
],
examples:[["월요일에 학교에 가요.","Dushanba kuni maktabga boraman."],["토요일에 친구를 만나요.","Shanba kuni do'stim bilan uchrashaman."],["무슨 요일이에요?","Qaysi hafta kuni?"],["주말에 뭐 해요?","Dam olish kunlari nima qilasiz?"],["금요일에 시험이 있어요.","Juma kuni imtihon bor."]],
mistakeWrong:"월요일 학교에 가요 (에 ni tashlab ketish)",
mistakeRight:"월요일에 학교에 가요",
mistakeWhy:"Aniq vaqt bildiruvchi so'zlarga (hafta kuni, soat, sana) deyarli har doim 에 qo'shiladi — bu qo'shimchasiz gap notabiiy eshitiladi.",
quiz:[
["'토요일에 친구를 만나요' qaysi kunni bildiradi?",["Payshanba","Juma","Shanba","Yakshanba"],2],
["'무슨 요일이에요?' nimani so'raydi?",["Necha sana?","Qaysi hafta kuni?","Qaysi oy?","Soat nechi?"],1],
["Qaysi so'zga 에 qo'shilmaydi?",["월요일","아침","오늘","토요일"],2],
["'주말' so'zining ma'nosi:",["Ish kuni","Dam olish kunlari","Bayram","Tug'ilgan kun"],1]]},

{id:"weather", cat:"Sifatlar", title:"날씨 형용사 va -고 — ob-havo tasvirlash",
explain:[
"Ob-havoni tasvirlashda sifat (형용사) ishlatiladi, harakat fe'li emas: 날씨가 더워요/추워요/따뜻해요/시원해요. Yomg'ir va qor uchun esa 오다 (kelmoq) fe'li ishlatiladi: 비가 와요, 눈이 와요.",
"Ikki ob-havo holatini yoki ikki harakat/sifatni ketma-ket bog'lashda -고 ishlatiladi: 맑고 따뜻해요 (ochiq va iliq), 비가 오고 추워요 (yomg'ir yog'adi va sovuq).",
"-고 shuningdek harakatlar ketma-ketligini ham bildiradi: 아침을 먹고 학교에 가요 (nonushta qilib, maktabga boraman) — bu 'avval X, keyin Y' ma'nosida."
],
examples:[["오늘 날씨가 어때요?","Bugun ob-havo qanday?"],["비가 오고 바람이 불어요.","Yomg'ir yog'adi va shamol esadi."],["날씨가 맑고 따뜻해요.","Ob-havo ochiq va iliq."],["겨울에는 눈이 와요.","Qishda qor yog'adi."],["오늘은 흐리고 추워요.","Bugun bulutli va sovuq."]],
mistakeWrong:"비가 해요 (yomg'ir uchun 하다 fe'lini ishlatish)",
mistakeRight:"비가 와요",
mistakeWhy:"Ko'p til o'rganuvchi 'yomg'ir qiladi' deb o'ylab 하다 ishlatadi, lekin koreyscha yomg'ir/qor har doim 오다 (kelmoq) fe'li bilan ifodalanadi.",
quiz:[
["'비가 와요' gapida qaysi fe'l ishlatilgan?",["하다","오다","가다","있다"],1],
["'-고' qo'shimchasi nimani bog'laydi?",["Faqat otlarni","Ikki fe'l/sifatni","Faqat sonlarni","Faqat savollarni"],1],
["Ob-havoni tasvirlashda nima ishlatiladi?",["Fe'l","Sifat","Son","Olmosh"],1],
["'흐려요' so'zining ma'nosi:",["Quyoshli","Bulutli","Yomg'irli","Shamolli"],1]]},

{id:"desire-imperative", cat:"Istak va buyruq", title:"-고 싶어요 va -(으)세요 — xohish va hurmatli buyruq",
explain:[
"-고 싶어요 — fe'l tanasiga qo'shilib, shaxsning o'z xohishini bildiradi: 쉬고 싶어요 (dam olmoqchiman), 먹고 싶어요 (yemoqchiman). Asosan birinchi shaxs uchun tabiiy ishlatiladi.",
"-(으)세요 — hurmatli buyruq yoki yumshoq maslahat berish uchun ishlatiladi: fe'l undosh bilan tugasa -으세요 (먹다→드세요, maxsus shakl), unli bilan tugasa -세요 (쉬다→쉬세요).",
"Ikkalasi ham kundalik hayotda juda ko'p ishlatiladi: -고 싶어요 — nima istashingizni aytganda, -(으)세요 — birovga maslahat yoki ko'rsatma berganda."
],
examples:[["집에서 쉬고 싶어요.","Uyda dam olmoqchiman."],["이 약을 드세요.","Bu dorini iching."],["빨리 나으세요.","Tezroq tuzaling."],["한국어를 배우고 싶어요.","Koreys tilini o'rganmoqchiman."],["여기 앉으세요.","Shu yerga o'tiring."]],
mistakeWrong:"먹고 싶어요 (buyruq o'rniga ishlatish) / 드세요 o'rniga 먹으세요 ishlatish",
mistakeRight:"드세요 (yemoq fe'lining hurmatli buyruq shakli maxsus)",
mistakeWhy:"먹다 (yemoq) fe'lining hurmatli shakli muntazam qoidadan farq qiladi: 먹으세요 emas, 드세요 ishlatiladi — bu tez-tez uchraydigan istisno.",
quiz:[
["'집에서 쉬고 싶어요' gapining ma'nosi:",["Uyda dam oldim","Uyda dam olmoqchiman","Uyda dam olyapman","Uyda dam oling"],1],
["'-(으)세요' qanday ma'noni beradi?",["Savol","Hurmatli buyruq/maslahat","O'tgan zamon","Inkor"],1],
["먹다 ning hurmatli buyruq (maxsus) shakli:",["먹으세요","드세요","먹어세요","먹다세요"],1],
["'-고 싶어요' odatda kimning xohishini bildiradi?",["Tinglovchining","Gapiruvchining","Uchinchi shaxsning","Hech kimning"],1]]},

{id:"formal-style", cat:"Nutq uslublari", title:"-습니다/ㅂ니다 — rasmiy nutq uslubi",
explain:[
"-아요/어요 kundalik, neytral uslub bo'lsa, -습니다 (undosh bilan tugagan fe'lga)/ㅂ니다 (unli bilan tugagan fe'lga) rasmiy, qat'iy hurmatli uslubni bildiradi: 좋아하다→좋아합니다, 있다→있습니다, 가다→갑니다.",
"Bu uslub ish suhbati, rasmiy taqdimot, yangiliklar, harbiy xizmat kabi rasmiy vaziyatlarda ishlatiladi. Savol shakli -습니까?/ㅂ니까?: 어디에 갑니까? (Qayerga borasiz?).",
"O'tgan zamonda ham xuddi shu uslub ishlatiladi: -았/었습니다 (왔어요→왔습니다). Qoidasi oddiy -았/었어요 bilan bir xil, faqat oxiri -습니다 ga almashadi."
],
examples:[["저는 학생입니다.","Men talabaman (rasmiy)."],["처음 뵙겠습니다.","Birinchi marta ko'rishyapmiz (juda rasmiy)."],["어디에서 오셨습니까?","Qayerdan keldingiz? (rasmiy savol)"],["감사합니다.","Rahmat (rasmiy)."],["한국에 작년에 왔습니다.","Koreyaga o'tgan yili keldim (rasmiy)."]],
mistakeWrong:"학생입니다 bilan 학생이에요 ni bir xil vaziyatda farqsiz ishlatish",
mistakeRight:"Ish suhbatida -습니다, do'stlar bilan -아요/어요",
mistakeWhy:"Ikkala uslub ham to'g'ri, lekin vaziyatga mos kelmasa, g'alati eshitiladi — xuddi o'zbekchada rasmiy uchrashuvda 'salom' o'rniga 'assalomu alaykum' kerak bo'lgani kabi.",
quiz:[
["-습니다 qaysi uslub?",["Kundalik","Rasmiy/hurmatli","Bolalarcha","Buyruq"],1],
["Undosh bilan tugagan fe'lga qaysi qo'shimcha qo'shiladi?",["ㅂ니다","습니다","아요","어요"],1],
["Rasmiy uslubdagi o'tgan zamon qo'shimchasi:",["-아요/어요","-았/었어요","-았/었습니다","-(으)ㄹ 거예요"],2],
["'처음 뵙겠습니다' qachon aytiladi?",["Xayrlashganda","Birinchi juda rasmiy tanishuvda","Ovqatlanishda","Uxlashdan oldin"],1]]},

{id:"intention-distance", cat:"Reja va masofa", title:"-(으)려고 해요 va N에서 N까지 — niyat va masofa",
explain:[
"-(으)려고 해요 — niyatni bildiradi: fe'l tanasi undosh bilan tugasa -으려고 해요 (먹다→먹으려고 해요), unli bilan tugasa -려고 해요 (가다→가려고 해요). -(으)ㄹ 거예요 dan farqi — bu ko'proq ichki niyatni ta'kidlaydi.",
"N에서 N까지 — 'A dan B gacha' tuzilishi: boshlang'ich nuqta + 에서, oxirgi nuqta + 까지. Keyin vaqt yoki masofa + 걸려요 (ketadi) qo'shiladi: 집에서 학교까지 30분 걸려요.",
"Bu ikki tuzilish sayohat va transport haqida gapirishda birga ko'p ishlatiladi: qayerga borishni niyat qilish (-려고 해요) va u yergacha qancha vaqt ketishini aytish (에서~까지 걸려요)."
],
examples:[["부산에 가려고 해요.","Pusanga bormoqchiman."],["집에서 학교까지 30분 걸려요.","Uydan maktabgacha 30 daqiqa ketadi."],["이번 방학에 여행하려고 해요.","Bu ta'tilda sayohat qilmoqchiman."],["서울역에서 여기까지 가까워요.","Seul vokzalidan bu yergacha yaqin."],["저녁을 먹으려고 해요.","Kechki ovqat yemoqchiman."]],
mistakeWrong:"에서 va 부터 ni farqlamay aralashtirib ishlatish",
mistakeRight:"에서~까지 (joy uchun), 부터~까지 (vaqt uchun ham ishlatiladi)",
mistakeWhy:"에서~까지 asosan joy (masofa)ni bildiradi; vaqt oralig'i uchun 부터~까지 ham ishlatilishi mumkin, lekin 에서 joy ma'nosida ko'proq tabiiy.",
quiz:[
["'부산에 가려고 해요' gapining ma'nosi:",["Pusanga bordim","Pusanga bormoqchiman","Pusanda yashayman","Pusandan keldim"],1],
["'...에서 ...까지' tuzilishi nimani bildiradi?",["...dan ...gacha","...bilan birga","...uchun","...haqida"],0],
["'집에서 학교까지 30분 걸려요' nimani bildiradi?",["30 marta borish kerak","30 daqiqa vaqt ketadi","30 bekat bor","30 daqiqa kutish kerak"],1],
["-(으)려고 해요 nimani ta'kidlaydi?",["Tashqi majburiyat","Ichki niyat","O'tgan harakat","Imkonsizlik"],1]]},

{id:"reason-negation", cat:"Sabab va inkor", title:"-아서/어서, 못 va -지요? — sabab, inkor, tasdiqlash",
explain:[
"-아서/어서 — sababni bildiradi ('...gani uchun'): fe'l/sifat tanasiga qo'shiladi, 바빠서 (band bo'lgani uchun), 아파서 (og'rigani uchun). Bu qism gapning birinchi yarmi bo'lib, natija keyin keladi.",
"못 — tashqi sabab tufayli qila olmaslikni bildiradi: 못 갔어요 (bora olmadim). 안 — shunchaki, o'z xohishi bilan qilmaslikni bildiradi: 안 갔어요 (bormadim). Ikkisi farqli ma'noga ega.",
"-지요?/-죠? — allaqachon taxmin qilingan narsani tasdiqlashda ishlatiladi, o'zbekcha '-ku, shundaymi?' ma'nosiga yaqin: 잘 지내지요? (yaxshi yuryapsiz-ku, shundaymi?)."
],
examples:[["바빠서 못 갔어요.","Band bo'lganim uchun bora olmadim."],["길이 막혀서 늦었어요.","Yo'l tirband bo'lgani uchun kech qoldim."],["오늘은 안 가요.","Bugun bormayman (o'z xohishim bilan)."],["요즘 잘 지내지요?","Yaqinda yaxshi yuryapsiz-ku, shundaymi?"],["아파서 학교에 못 갔어요.","Og'rib qolganim uchun maktabga bora olmadim."]],
mistakeWrong:"못 va 안 ni farqsiz ishlatish",
mistakeRight:"못 — tashqi sabab bilan qila olmaslik, 안 — shunchaki qilmaslik",
mistakeWhy:"'Kasal bo'lganim uchun bormadim' da 못 kerak (tashqi sabab bor), lekin 'xohlamaganim uchun bormadim' da 안 kerak (shunchaki tanlov).",
quiz:[
["'바빠서 못 갔어요' gapining ma'nosi:",["Band bo'lmaganim uchun bordim","Band bo'lgani uchun bora olmadim","Band emasman","Borishni xohlamadim"],1],
["못 va 안 orasidagi farq:",["Farqi yo'q","못 — qila olmaslik, 안 — shunchaki qilmaslik","안 — qila olmaslik, 못 — shunchaki qilmaslik","Ikkalasi ham tasdiq"],1],
["'-지요?' qanday savol turi?",["Oddiy savol","Tasdiqlash savoli","Inkor savol","Buyruq savol"],1],
["'길이 막혀서 늦었어요' da sabab nima?",["Uxlab qolgan","Yo'l tirband bo'lgan","Kasal bo'lgan","Unutgan"],1]]},

{id:"adjective-modifier", cat:"Sifatlar", title:"형용사 + (으)ㄴ + 명사 — sifat bilan otni bog'lash",
explain:[
"Sifat otdan oldin kelganda -(으)ㄴ shaklga o'tadi: 싸다→싼 (arzon), 예쁘다→예쁜 (chiroyli), 크다→큰 (katta), 작다→작은 (kichik), 길다→긴 (uzun, ㄹ tushadi — istisno).",
"있다/없다 bilan tugaydigan sifatlarga esa -는 qo'shiladi, -(으)ㄴ emas: 맛있다→맛있는 음식 (mazali taom), 재미있다→재미있는 영화 (qiziqarli kino).",
"Bir necha sifatni ketma-ket ishlatish uchun -고 bilan bog'lanadi: 싸고 예쁜 옷 (arzon va chiroyli kiyim) — bu yerda birinchi sifat -고 shaklida, ikkinchisi otdan oldin -(으)ㄴ shaklida keladi."
],
examples:[["싼 옷을 샀어요.","Arzon kiyim sotib oldim."],["긴 바지를 입어요.","Uzun shim kiyaman."],["맛있는 음식이에요.","Bu mazali taom."],["작은 가방이 있어요.","Kichik sumkam bor."],["싸고 예쁜 신발을 찾아요.","Arzon va chiroyli poyabzal qidiryapman."]],
mistakeWrong:"길다 ning ot oldidagi shaklini '길은' deb yozish",
mistakeRight:"긴 (ㄹ tushib ketadi)",
mistakeWhy:"Ko'p sifat -(으)ㄴ qo'shilganda muntazam, lekin 길다, 멀다 kabi ㄹ bilan tugaydigan ba'zi so'zlarda ㄹ tushib ketadi: 길다→긴, 멀다→먼.",
quiz:[
["예쁘다 (chiroyli) sifatining ot oldidagi shakli:",["예쁜","예쁘다","예뻐요","예쁘고"],0],
["맛있다 (mazali) ning ot oldidagi shakli:",["맛있은","맛있는","맛있다","맛있고"],1],
["길다 (uzun) ning ot oldidagi shakli (istisno):",["길은","긴","길다","길고"],1],
["'싸고 예쁜 옷' iborasida nechta sifat bor?",["Bitta","Ikkita","Uchta","Hech qaysi"],1]]},

{id:"purpose-progressive", cat:"Maqsad va davomiylik", title:"-(으)러 가다, -(으)면서 va -고 있어요 — maqsad, bir vaqtdagi harakat, davom etish",
explain:[
"-(으)러 가다/오다 — harakatning maqsadini bildiradi: 보러 가요 (ko'rgani boraman), 먹으러 가요 (yegani boraman). Faqat 가다/오다/다니다 kabi harakat fe'llari bilan ishlatiladi.",
"-(으)면서 — ikki harakat bir vaqtda, bir kishi tomonidan bajarilganda ishlatiladi: 마시면서 기다려요 (ichgan holda kutaman), 들으면서 공부해요 (tinglagan holda o'qiyman).",
"-고 있어요 — harakat hozir davom etayotganini bildiradi (davomiy/progressiv zamon): 기다리고 있어요 (kutib turibman), 가고 있어요 (ketyapman) — -아요/어요 dan farqli, aniq 'hozir sodir bo'lmoqda' ma'nosi bor."
],
examples:[["영화 보러 가요.","Kino ko'rgani boraman."],["음악을 들으면서 공부해요.","Musiqa tinglagan holda o'qiyman."],["지금 밥을 먹고 있어요.","Hozir ovqat yeyapman."],["친구를 만나러 가요.","Do'stimni ko'rgani boraman."],["전화하면서 걸어요.","Telefonda gaplashgan holda yuraman."]],
mistakeWrong:"-(으)면서 bilan ikki boshqa kishi bajargan harakatni bog'lash",
mistakeRight:"-(으)면서 faqat BIR kishi bir vaqtda bajargan ikki harakat uchun",
mistakeWhy:"'Men ovqat yeyman, u gapiradi' kabi ikki TURLI kishining harakatini -(으)면서 bilan bog'lab bo'lmaydi — bu faqat bitta subyekt uchun ishlaydi.",
quiz:[
["'-(으)러' qanday ma'no bildiradi?",["Sabab","Maqsad","Vaqt","Joy"],1],
["'-고 있어요' nimani bildiradi?",["Tugallangan harakat","Hozir davom etayotgan harakat","Kelasi reja","Imkonsizlik"],1],
["'-(으)면서' nechta harakatni bog'laydi?",["Bitta","Ikkita (bir vaqtda)","Uchta","Cheksiz"],1],
["'음악을 들으면서 공부해요' gapining ma'nosi:",["Musiqa tinglab bo'lib o'qiydi","Musiqa tinglagan holda o'qiydi","Musiqa tinglamay o'qiydi","O'qib bo'lib tinglaydi"],1]]},

{id:"honorific", cat:"Hurmat shakllari", title:"-(으)시- — hurmat ko'rsatkichi",
explain:[
"Katta yoshli yoki hurmat qilinadigan shaxs (ota-ona, bobo-buvi, o'qituvchi, mijoz) haqida gapirganda fe'lga -(으)시- qo'shiladi: 가다→가세요 (boradilar), 하다→하세요 (qiladilar), 읽다→읽으세요 (o'qiydilar).",
"Ba'zi fe'llarning butunlay maxsus hurmat shakli bor: 있다→계세요 (bor/turadilar), 먹다/마시다→드세요 (yeydilar/ichadilar), 자다→주무세요 (uxlaydilar), 아프다→편찮으세요 (kasal bo'ladilar).",
"Kelasi zamon bilan birga ham ishlatiladi: -(으)실 거예요 (오다→오실 거예요 — keladilar). Bu shakl -(으)세요 (buyruq) bilan tashqi ko'rinishi bir xil, lekin gap mazmunidan qaysi biri ekanligi aniq bo'ladi."
],
examples:[["아버지는 회사에 가세요.","Otam ishga boradilar."],["할머니가 진지를 드세요.","Buvim ovqat yeydilar."],["선생님께서 책을 읽으세요.","O'qituvchi kitob o'qiydilar."],["부모님이 집에 계세요.","Ota-onam uyda bor."],["어머니가 일찍 주무세요.","Onam erta uxlaydilar."]],
mistakeWrong:"할머니가 먹어요 (katta yoshli kishiga oddiy fe'l ishlatish)",
mistakeRight:"할머니가 드세요",
mistakeWhy:"Oddiy -아요/어요 shakli katta yoshli yoki hurmatli shaxs haqida gapirganda yetarli hurmat bildirmaydi — -(으)시- yoki maxsus hurmat fe'li kerak.",
quiz:[
["'아버지는 산에 가세요' da hurmat ko'rsatkichi qaysi?",["가요","가세요","갔어요","갈 거예요"],1],
["'있다' ning hurmat shakli:",["계세요","드세요","주무세요","편찮으세요"],0],
["'자다' (uxlamoq) ning hurmat shakli:",["드세요","계세요","주무세요","편찮으세요"],2],
["-(으)시- kimga nisbatan ishlatiladi?",["Kichik yoshdagilarga","Hurmatli/katta yoshli shaxslarga","Hayvonlarga","Narsalarga"],1]]},

{id:"request-conditional", cat:"Iltimos va shart", title:"-아/어 주세요, -(으)면 va -아/어 보세요 — iltimos, shart, tavsiya",
explain:[
"-아/어 주세요 — birovdan nimanidir qilib berishini iltimos qilish: fe'l tanasiga -아요/어요 bilan bir xil qoida bo'yicha qo'shiladi, 찍다→찍어 주세요 (olib bering), 도와주다→도와주세요 (yordam bering).",
"-(으)면 — shart bildiradi ('agar...sa'): 시간이 있으면 (vaqt bo'lsa), 비가 오면 (yomg'ir yog'sa). Har doim 'agar X bo'lsa, Y' tuzilishida ishlatiladi.",
"-아/어 보세요 — 'qilib ko'ring' ma'nosida tavsiya berish: 가 보세요 (borib ko'ring), 먹어 보세요 (yeb ko'ring). Ko'pincha -(으)면 bilan birga keladi: 시간이 있으면 가 보세요."
],
examples:[["여기 앉아 주세요.","Shu yerga o'tiring, iltimos."],["비가 오면 우산을 쓰세요.","Yomg'ir yog'sa, soyabon ishlating."],["이 음식을 먹어 보세요.","Bu taomni yeb ko'ring."],["창문 좀 열어 주세요.","Derazani ochib bering."],["시간이 있으면 전화해 주세요.","Vaqtingiz bo'lsa, qo'ng'iroq qiling."]],
mistakeWrong:"-(으)면 ni faqat o'tgan voqealar bilan ishlatish",
mistakeRight:"-(으)면 har doim shart/taxmin uchun, zamon fe'lning o'zidan ko'rinadi",
mistakeWhy:"-(으)면 o'zi zamon bildirmaydi — u faqat shartni bog'laydi; gapning zamoni asosiy fe'lda (키거나 거예요, -세요 kabi) ko'rinadi.",
quiz:[
["'-아/어 주세요' qachon ishlatiladi?",["Birovdan biror narsa qilib berishini iltimos qilganda","O'z harakatini aytganda","Savol berganda","Taqiq qo'yganda"],0],
["'시간이 있으면 가 보세요' dagi '-(으)면' nimani bildiradi?",["Sabab","Shart (...sa)","O'tgan zamon","Taqiq"],1],
["'가 보세요' gapining ma'nosi:",["Bordim","Borib ko'ring","Bormang","Boraman"],1],
["'-아/어 보세요' qanday ma'no beradi?",["Buyruq (qat'iy)","Tavsiya (qilib ko'ring)","Taqiq","Savol"],1]]},

];
if (typeof module !== "undefined") { module.exports = { GRAMMAR }; }
