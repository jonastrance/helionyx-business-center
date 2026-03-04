export const DOMAINS = [
  {n:'abbot.app',e:'2026-06-05',s:'active'},{n:'acturyx.com',e:'2026-11-18',s:'active'},
  {n:'auroraawake.com',e:'2026-05-30',s:'active'},{n:'cablekink.com',e:'2026-05-04',s:'active'},
  {n:'catalystsync.com',e:'2026-05-30',s:'active'},{n:'circlecinch.com',e:'2026-04-03',s:'active'},
  {n:'completecritique.com',e:'2026-05-04',s:'active'},{n:'convergyx.com',e:'2026-12-27',s:'active'},
  {n:'creatorbinder.com',e:'2026-05-13',s:'active'},{n:'crispypenguin.com',e:'2026-08-11',s:'active'},
  {n:'desertbellows.com',e:'2026-05-14',s:'active'},{n:'driftyx.com',e:'2026-04-21',s:'active'},
  {n:'elevatebridge.com',e:'2026-05-30',s:'active'},{n:'evolyx.com',e:'2026-10-28',s:'active'},
  {n:'flourishfountain.com',e:'2026-05-30',s:'active'},{n:'frostbound.info',e:'2026-04-04',s:'active'},
  {n:'fuzzyoctopus.com',e:'2026-08-11',s:'active'},{n:'havenscreen.com',e:'2027-01-18',s:'active'},
  {n:'helionyx.com',e:'2027-10-23',s:'active'},{n:'helionyxcommons.com',e:'2026-08-24',s:'active'},
  {n:'heliumcore.com',e:'2026-06-27',s:'active'},{n:'heliumrelay.com',e:'2026-04-19',s:'active'},
  {n:'iffoundnote.com',e:'2026-12-02',s:'active'},{n:'impulseseed.com',e:'2026-05-30',s:'active'},
  {n:'jonastrance.com',e:'2026-03-17',s:'alert'},{n:'julythe4.com',e:'2026-07-03',s:'active'},
  {n:'learnbinder.com',e:'2026-05-30',s:'active'},{n:'livelylush.com',e:'2026-05-30',s:'active'},
  {n:'lonelinesslagoon.com',e:'2026-12-17',s:'active'},{n:'lonlinesslagoon.com',e:'2027-01-21',s:'active'},
  {n:'lowfourfigures.com',e:'2026-05-13',s:'active'},{n:'mechanicsvillenotary.com',e:'2026-09-11',s:'active'},
  {n:'mediamatryx.com',e:'2026-12-01',s:'active'},{n:'mediastak.com',e:'2026-04-03',s:'active'},
  {n:'mediastak.org',e:'2026-05-21',s:'active'},{n:'nailzwithjaz.com',e:'2026-10-23',s:'active'},
  {n:'passivematter.com',e:'2026-04-28',s:'active'},{n:'passivematters.com',e:'2026-04-28',s:'active'},
  {n:'photofable.com',e:'2026-05-14',s:'active'},{n:'playbrake.com',e:'2026-04-04',s:'active'},
  {n:'playbrayx.com',e:'2026-11-25',s:'active'},{n:'populyx.com',e:'2026-11-04',s:'active'},
  {n:'powerbombed.com',e:'2026-05-13',s:'active'},{n:'precipyx.com',e:'2026-04-21',s:'active'},
  {n:'pulsepanorama.com',e:'2026-05-30',s:'active'},{n:'quickprompthub.com',e:'2026-05-13',s:'active'},
  {n:'quickresponse.codes',e:'2026-08-11',s:'active'},{n:'raevik.com',e:'2026-05-13',s:'active'},
  {n:'recipyx.com',e:'2026-10-23',s:'active'},{n:'remoteintel.com',e:'2026-05-13',s:'active'},
  {n:'resumecents.com',e:'2026-04-28',s:'active'},{n:'resumefyx.com',e:'2026-11-25',s:'active'},
  {n:'royaltyriver.com',e:'2026-05-14',s:'active'},{n:'rvacommons.com',e:'2026-08-11',s:'active'},
  {n:'ryanmauldin.design',e:'2026-04-19',s:'active'},{n:'ryanmauldin.me',e:'2026-05-04',s:'active'},
  {n:'sortbookmark.com',e:'2026-04-04',s:'active'},{n:'stellastitch.com',e:'2026-07-08',s:'active'},
  {n:'sunwidget.com',e:'2026-05-14',s:'active'},{n:'survivalcombo.com',e:'2026-05-14',s:'active'},
  {n:'syncyx.com',e:'2026-12-30',s:'active'},{n:'theheliumhub.com',e:'2026-04-03',s:'active'},
  {n:'theyxchromosome.com',e:'2026-08-11',s:'active'},{n:'theyxnetwork.com',e:'2026-05-13',s:'active'},
  {n:'tinyhx.com',e:'2026-05-13',s:'active'},{n:'togetyx.com',e:'2026-04-21',s:'active'},
  {n:'unityuprise.com',e:'2026-05-30',s:'active'},{n:'upliftnexus.com',e:'2026-05-30',s:'active'},
  {n:'vibyx.com',e:'2026-11-13',s:'active'},{n:'webkyx.com',e:'2026-04-21',s:'active'},
  {n:'whisperingwireless.com',e:'2026-08-11',s:'active'},{n:'wonderpuddle.com',e:'2026-08-11',s:'active'},
  {n:'zenlagoon.com',e:'2027-01-21',s:'active'},
];

export function daysLeft(dateStr) {
  const x = new Date(dateStr); x.setHours(0,0,0,0);
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.ceil((x - t) / 86400000);
}

export function urgencyClass(days) {
  if (days <= 14) return 'text-danger';
  if (days <= 30) return 'text-warn';
  if (days <= 60) return 'text-yellow-400';
  return 'text-success';
}

export function urgencyBadge(days) {
  if (days <= 0)  return 'badge-red';
  if (days <= 14) return 'badge-red';
  if (days <= 30) return 'badge-orange';
  if (days <= 60) return 'badge-yellow';
  return 'badge-green';
}

export function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
