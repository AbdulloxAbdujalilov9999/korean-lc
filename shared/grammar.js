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

];
if (typeof module !== "undefined") { module.exports = { GRAMMAR }; }
