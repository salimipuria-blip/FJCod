import { useMemo } from 'react';
import { AlertTriangle, Banknote, Flame, Lightbulb, Package, Receipt, ShoppingBag, ShoppingCart, Target, TrendingUp, Trophy, UsersRound } from 'lucide-react';
import type { PageId } from '../App';
import { can, currentUser, openShiftOf, useStore } from '../core/store';
import { comparePeriod, dailySeries, growthStreak, insights, leaderboard, repeatRate, sellerOf, targetProgress, topProducts, winBackList } from '../core/growth';
import { saleNet } from '../core/sales';
import { addDays, fa, jDate, jMonthName, startOfDay, startOfJMonth, toman, tomanShort, WEEKDAYS, weekdayIndex, fa0 } from '../lib/format';
import { BarChart } from '../components/charts';
import { Delta, Empty, Kpi, Progress } from '../components/ui';
import { ROLES } from '../core/permissions';

export function Dashboard({ go }: { go: (p: PageId) => void }) {
  const { db } = useStore();
  const user = currentUser(db)!;
  const now = Date.now();
  const storeWide = can(user.role, 'dashboard.store');

  const data = useMemo(() => {
    const mine = db.sales.filter((s) => sellerOf(s) === user.id || s.cashierId === user.id);
    const sales = storeWide ? db.sales : mine;
    return {
      sales,
      day: comparePeriod(sales, now, 'day'),
      week: comparePeriod(sales, now, 'week'),
      month: comparePeriod(sales, now, 'month'),
      series: dailySeries(sales, now, 30),
      streak: growthStreak(sales, now),
      target: storeWide
        ? targetProgress(db.sales, now, db.settings.monthlyStoreTarget)
        : targetProgress(db.sales, now, user.monthlyTarget, (s) => sellerOf(s) === user.id),
      repeat: repeatRate(sales, addDays(now, -90), now + 1),
      prevRepeat: repeatRate(sales, addDays(now, -180), addDays(now, -90)),
      top: topProducts(sales, db.products, startOfJMonth(now), now + 1, 5),
      board: leaderboard(db.sales, db.users, startOfJMonth(now), now + 1).slice(0, 5),
      tips: storeWide ? insights(db, now) : [],
      winBack: winBackList(db.customers, db.sales, now, db.settings.winBackDays).slice(0, 5),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, user.id, storeWide]);

  const lowStock = db.products.filter((p) => p.active && p.stock <= p.minStock);
  const shift = openShiftOf(db, user.id);
  const myHeld = db.heldCarts.filter((h) => h.by === user.id).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>سلام، {user.name.split('—').pop()!.trim()}</h2>
          <p>
            {WEEKDAYS[weekdayIndex(now)]}، {jDate(now)} · {ROLES[user.role].title}
            {!storeWide && ' · نمای شخصی'}
          </p>
        </div>
        <div className="row">
          {can(user.role, 'pos.use') && (
            <button className="btn btn-primary" onClick={() => go('pos')}>
              <ShoppingBag size={18} /> {shift ? 'ادامهٔ فروش' : 'شروع فروش'}
            </button>
          )}
          {!can(user.role, 'pos.use') && can(user.role, 'pos.hold') && (
            <button className="btn btn-primary" onClick={() => go('pos')}>
              <ShoppingCart size={18} /> سبد پیشنهادی جدید {myHeld > 0 && `(${fa(myHeld)} در صف)`}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-4">
        <Kpi icon={<Banknote size={16} />} label="فروش امروز" value={tomanShort(data.day.current.revenue)} unit="تومان" foot={<><Delta value={data.day.revenueGrowth} /> نسبت به دیروز تا این ساعت</>} />
        <Kpi icon={<TrendingUp size={16} />} label="فروش این هفته" value={tomanShort(data.week.current.revenue)} unit="تومان" foot={<><Delta value={data.week.revenueGrowth} /> نسبت به هفتهٔ قبل</>} />
        <Kpi icon={<Receipt size={16} />} label={`فروش ${jMonthName(now)}`} value={tomanShort(data.month.current.revenue)} unit="تومان" foot={<><Delta value={data.month.revenueGrowth} /> نسبت به ماه قبل</>} />
        <Kpi icon={<ShoppingCart size={16} />} label="میانگین سبد (ماه)" value={tomanShort(data.month.current.avgBasket)} unit="تومان" foot={<><Delta value={data.month.basketGrowth} /> · {fa(data.month.current.count)} فاکتور</>} />
      </div>

      <div className="grid grid-main">
        <section className="card">
          <div className="card-head">
            <h3>روند فروش ۳۰ روز اخیر</h3>
            <span className="subtle">مبالغ پس از کسر مرجوعی</span>
          </div>
          <div className="card-body">
            <BarChart
              caption="فروش روزانه ۳۰ روز اخیر"
              labelEvery={5}
              data={data.series.map((p) => ({
                key: p.day,
                label: fa0(String(new Intl.DateTimeFormat('en-u-ca-persian', { day: 'numeric' }).format(p.day))),
                title: `${WEEKDAYS[weekdayIndex(p.day)]} ${jDate(p.day)}`,
                value: p.revenue,
                sub: `${fa(p.count)} فاکتور`,
                dim: p.day === startOfDay(now),
              }))}
            />
          </div>
        </section>

        <section className="stack">
          <div className="streak">
            <div className="girih" aria-hidden />
            <Flame size={34} color="#e6be62" />
            <div>
              <div className="streak-num">{fa(data.streak)}</div>
              <div style={{ fontSize: 13 }}>هفتهٔ پیاپی رشد {storeWide ? 'فروشگاه' : 'شما'}</div>
            </div>
            <div style={{ marginInlineStart: 'auto', textAlign: 'left', fontSize: 12, color: '#d6d3d1' }}>
              اهرم موفقیت:
              <br />
              <b style={{ color: '#fff' }}>رشد و تکرار رشد</b>
            </div>
          </div>
          <div className="card card-pad stack" style={{ gap: 10 }}>
            <div className="row between">
              <b className="row" style={{ gap: 8 }}><Target size={16} color="var(--gold)" /> {storeWide ? 'هدف ماه فروشگاه' : 'هدف ماه شما'}</b>
              <span className="badge gold num">{fa(data.target.pct)}٪</span>
            </div>
            {data.target.target > 0 ? (
              <>
                <Progress value={data.target.pct} good={data.target.pct >= 100} />
                <div className="row between subtle">
                  <span>{tomanShort(data.target.achieved)} از {tomanShort(data.target.target)}</span>
                  <span>پیش‌بینی: {fa(data.target.projectedPct)}٪</span>
                </div>
                {data.target.pct < 100 && <div className="subtle">نیاز روزانه: <b className="num">{toman(data.target.dailyNeeded)}</b> · {fa(data.target.daysLeft)} روز مانده</div>}
              </>
            ) : (
              <span className="subtle">هدفی تعریف نشده است.</span>
            )}
          </div>
          <div className="card card-pad stack" style={{ gap: 6 }}>
            <b className="row" style={{ gap: 8 }}><UsersRound size={16} color="var(--gold)" /> نرخ خرید تکراری (۹۰ روز)</b>
            <div className="row between">
              <span className="kpi-value">{fa(data.repeat)}٪</span>
              <Delta value={data.repeat - data.prevRepeat} />
            </div>
            <span className="subtle">سهم مشتریانی که دوباره خرید کرده‌اند — قلب «تکرار رشد».</span>
          </div>
        </section>
      </div>

      <div className="grid grid-2">
        {storeWide && (
          <section className="card">
            <div className="card-head">
              <h3 className="row" style={{ gap: 8 }}><Lightbulb size={16} color="var(--gold)" /> اقدامات پیشنهادی امروز</h3>
              <button className="btn btn-sm" onClick={() => go('growth')}>موتور رشد</button>
            </div>
            {data.tips.length === 0 ? (
              <Empty icon={<Lightbulb size={28} />} title="همه چیز روبه‌راه است" />
            ) : (
              data.tips.map((t, i) => (
                <div key={i} className={`insight ${t.tone}`}>
                  <span className="dot">{t.tone === 'warn' ? <AlertTriangle size={16} /> : t.tone === 'good' ? <TrendingUp size={16} /> : <Lightbulb size={16} />}</span>
                  <div>
                    <b>{t.title}</b>
                    <div className="subtle">{t.action}</div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        <section className="card">
          <div className="card-head">
            <h3 className="row" style={{ gap: 8 }}><Trophy size={16} color="var(--gold)" /> پرفروش‌های {jMonthName(now)}</h3>
          </div>
          {data.top.length === 0 ? (
            <Empty icon={<Package size={28} />} title="هنوز فروشی در این ماه ثبت نشده" />
          ) : (
            <div className="list">
              {data.top.map((t, i) => (
                <div key={t.productId} className="list-row">
                  <span className="badge gold num">{fa(i + 1)}</span>
                  <div className="grow ellipsis">{t.name}</div>
                  <span className="subtle num">{fa(t.qty)} عدد</span>
                  <b className="num">{tomanShort(t.revenue)}</b>
                </div>
              ))}
            </div>
          )}
        </section>

        {storeWide && (
          <section className="card">
            <div className="card-head">
              <h3 className="row" style={{ gap: 8 }}><Trophy size={16} color="var(--gold)" /> رتبه‌بندی فروشندگان ماه</h3>
            </div>
            <div className="list">
              {data.board.map((r, i) => (
                <div key={r.user.id} className="list-row">
                  <span className="badge num">{fa(i + 1)}</span>
                  <div className="grow">
                    <div className="ellipsis">{r.user.name}</div>
                    {r.target > 0 && <Progress value={r.pct} good={r.pct >= 100} />}
                  </div>
                  <b className="num">{tomanShort(r.revenue)}</b>
                </div>
              ))}
            </div>
          </section>
        )}

        {(storeWide || can(user.role, 'customers.edit')) && (
          <section className="card">
            <div className="card-head">
              <h3 className="row" style={{ gap: 8 }}><UsersRound size={16} color="var(--gold)" /> دعوت به بازگشت</h3>
              {can(user.role, 'growth.view') && <button className="btn btn-sm" onClick={() => go('growth')}>همه</button>}
            </div>
            {data.winBack.length === 0 ? (
              <Empty icon={<UsersRound size={28} />} title="مشتری منتظری نیست" />
            ) : (
              <div className="list">
                {data.winBack.map((w) => (
                  <div key={w.customer.id} className="list-row">
                    <div className="grow">
                      <div className="ellipsis">{w.customer.name}</div>
                      <div className="subtle num" dir="ltr" style={{ textAlign: 'right' }}>{fa0(w.customer.phone)}</div>
                    </div>
                    <span className="badge warn num">{fa(w.daysAway)} روز</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {storeWide && (
          <section className="card">
            <div className="card-head">
              <h3 className="row" style={{ gap: 8 }}><AlertTriangle size={16} color="var(--warn)" /> کم‌موجودی</h3>
              <button className="btn btn-sm" onClick={() => go('products')}>انبار</button>
            </div>
            {lowStock.length === 0 ? (
              <Empty icon={<Package size={28} />} title="موجودی همهٔ کالاها کافی است" />
            ) : (
              <div className="list">
                {lowStock.slice(0, 6).map((p) => (
                  <div key={p.id} className="list-row">
                    <div className="grow ellipsis">{p.name}</div>
                    <span className={`badge ${p.stock === 0 ? 'bad' : 'warn'} num`}>{fa(p.stock)} عدد</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {!storeWide && (
          <section className="card">
            <div className="card-head">
              <h3>آخرین فروش‌های شما</h3>
            </div>
            {data.sales.length === 0 ? (
              <Empty icon={<Receipt size={28} />} title="هنوز فروشی ثبت نکرده‌اید" />
            ) : (
              <div className="list">
                {data.sales.slice(-6).reverse().map((s) => (
                  <div key={s.id} className="list-row">
                    <span className="badge num">#{fa(s.number)}</span>
                    <div className="grow subtle">{jDate(s.at)}</div>
                    <b className="num">{toman(saleNet(s))}</b>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
