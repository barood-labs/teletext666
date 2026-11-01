import type { Lang, PageSource } from '../grid.ts';
export function index(lang: Lang): PageSource {
  return lang === 'ar' ? { num: 100, lang, title: 'الفهرس', lines: [
    '{y}تيليتكست 666', '{w}عاد من القبر. صفحات صغيرة، معلومات كبيرة.', '',
    '{g}300 {w}الطقس', '{y}400 {w}مواقيت الصلاة', '{c}888 {w}تنبيهات الزلازل', '{m}101 {w}عن الخدمة', '{r}666 {w}؟؟؟', '',
    '{w}كل صفحة أقل من 1 كيلوبايت.', '{w}تعمل على شبكات 2G والرسائل القصيرة.', '', '{c}اكتب رقم الصفحة: 300 أو 400',
  ] } : { num: 100, lang, title: 'INDEX', lines: [
    '{y}TELETEXT 666', '{w}Risen from the grave. Tiny pages, vital info.', '',
    '{g}300 {w}Weather', '{y}400 {w}Prayer times', '{c}888 {w}Earthquake alerts', '{m}101 {w}About this service', '{r}666 {w}???', '',
    '{w}Every page is under 1 KB.', '{w}Works on 2G, SMS and curl.', '', '{c}Add ?city=boise|london|amman|cairo|gaza|beirut',
  ] };
}
export function about(lang: Lang): PageSource {
  return lang === 'ar' ? { num: 101, lang, title: 'عن الخدمة', lines: [
    '{y}لماذا التيليتكست؟', '{w}في الفيضانات والحروب والانقطاعات تصبح المواقع الحديثة ثقيلة جداً. صُمم التيليتكست لنقل أهم المعلومات في 40 عموداً و24 سطراً.', '',
    '{g}الوصول:', '{w}المتصفح، أو curl، أو رسالة نصية P300.',
  ] } : { num: 101, lang, title: 'ABOUT', lines: [
    '{y}Why teletext?', '{w}In floods, wars and outages the modern web is too heavy. Teletext was built to carry what matters in 40 columns by 24 rows.', '',
    '{g}Access:', '{w}Browser, curl host/300, or text "P300" to the SMS gateway.', '', '{c}Open source. Built with Kiro.',
  ] };
}
export function graveyard(lang: Lang): PageSource {
  const dead = ['Ceefax 1974-2012', 'GeoCities 1994-2009', 'Flash 1996-2020', 'Vine 2013-2017', 'Google Reader 2005-2013', 'Internet Explorer 1995-2022', 'Teletext 1974-????'];
  return { num: 666, lang, title: lang === 'ar' ? 'المقبرة' : 'GRAVEYARD', lines: [
    lang === 'ar' ? '{r}مقبرة التقنيات الميتة' : '{r}THE GRAVEYARD OF DEAD WEB TECH', '',
    ...dead.map((d) => `{w}  + ${d}`), '',
    lang === 'ar' ? '{g}...لكن التيليتكست نهض من قبره.' : '{g}...but one of them climbed back out.',
  ] };
}
