import React, { useState, useCallback, useEffect } from "react";
import logo from "./images/Altass-logo.png";
import { sendToPipedrive } from "./API/CRMConnection";
// Optimized Process Component
const StepCard = ({ number, title, desc }) => (
  <div className="relative p-8 bg-zinc-900 border border-zinc-800 rounded-[32px] group hover:border-red-600 transition-all duration-500 h-full">
    <div className="absolute -top-4 -right-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-xl group-hover:scale-110 transition-transform">
      {number}
    </div>
    <h3 className="text-white text-xl font-bold mb-4 mt-2">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

const App = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    carType: "SUV (دفع رباعي)",
    budget: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Track page view when component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      // PageView is already tracked in HTML, but we can track additional info
      window.fbq("trackCustom", "PageView", {
        page_name: "Landing Page - Egypt Lead Gen",
        page_category: "Lead Generation",
      });
    }

    // Track when user views the form section (scroll to form)
    const handleScroll = () => {
      const formSection = document.getElementById("lead-form-section");
      if (formSection) {
        const rect = formSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible && typeof window !== "undefined" && window.fbq) {
          window.fbq("trackCustom", "ViewContent", {
            content_name: "Lead Form Section",
            content_category: "Form View",
          });
        }
      }
    };

    // Throttle scroll event
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    handleScroll(); // Check immediately

    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, []);

  const scrollToForm = useCallback(() => {
    // Track button click
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("trackCustom", "ButtonClick", {
        button_name: "Request Quote",
        button_location: "Header/CTA",
      });
    }
    const formSection = document.getElementById("lead-form-section");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const egyptPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egyptPhoneRegex.test(formData.phone)) {
      setError("يرجى إدخال رقم موبايل مصري صحيح (01xxxxxxxx)");
      setIsSubmitting(false);
      return;
    }

    // Track form submission start - Meta Pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Lead", {
        content_name: "Lead Form Submission",
        content_category: formData.carType,
        value: formData.budget
          ? parseFloat(formData.budget.replace(/[^0-9.]/g, ""))
          : undefined,
        currency: "EGP",
      });
    }

    try {
      // Send to Pipedrive CRM
      const crmResult = await sendToPipedrive(formData);

      if (!crmResult.success) {
        console.error("CRM Error:", crmResult.error);
        // Show error to user if CRM fails
        setError(
          `حدث خطأ في إرسال البيانات: ${crmResult.error}. يرجى المحاولة مرة أخرى.`
        );
        setIsSubmitting(false);
        return;
      }

      console.log("CRM Success:", crmResult.message);

      // Also try the original API endpoint (if it exists)
      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            source: "Exclusive_Landing_Page_Egypt",
          }),
        });
      } catch (apiErr) {
        // Ignore if endpoint doesn't exist, CRM is the main integration
        console.log("API endpoint not available, using CRM only");
      }

      // Track successful form submission - Meta Pixel
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "CompleteRegistration", {
          content_name: "Lead Form Success",
          content_category: formData.carType,
        });
      }

      setTimeout(() => {
        setIsSuccess(true);
        setIsSubmitting(false);
      }, 1000);
    } catch (err) {
      console.error("Form submission error:", err);
      setError("حدث خطأ فني، يرجى إعادة المحاولة.");
      setIsSubmitting(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const logoUrl =
    "https://www.altassmotors.com/uploads/settings/CSTXwN5YqjWfD4T0S9zYlqBf5p6rU9m3zP6mK9fS.png";

  return (
    <div
      className="min-h-screen flex flex-col font-['Cairo'] bg-black text-zinc-100 overflow-x-hidden"
      dir="rtl"
    >
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <img
            src={logo}
            alt="Altass Motors"
            className="h-auto w-20 brightness-110"
          />
          <button
            onClick={scrollToForm}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            طلب عرض سعر
          </button>
        </div>
      </header>

      {/* Hero Section with Form */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-l from-black via-black/60 to-transparent z-10"></div>
          <img
            src="https://www.altassmotors.com/uploads/sliders/NPtcN4iqaAAMzeKUpxssF5CNiZRi97DFPcnRBwf2.webp"
            alt="Dubai Luxury"
            className="w-full h-full object-cover opacity-60 scale-110"
          />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
            {/* Left Side: Hero Content */}
            <div className="order-2 lg:order-1">
              <span className="inline-block bg-red-600/20 text-red-500 border border-red-600/30 px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-black mb-6 md:mb-8 tracking-wide">
                خدمة استيراد السيارات الحصرية لمصر
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tight text-white">
                امتلك سيارة أحلامك من <span className="text-red-600">دبي</span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-zinc-400 mb-8 md:mb-12 leading-relaxed font-light">
                نحن في{" "}
                <span className="text-white font-bold">الطاس موتورز</span> نذلل
                لك كافة الصعاب. فحص فني دقيق، شحن مباشر، وتخليص كافة الأوراق
                القانونية.
              </p>
              <div className="flex flex-wrap gap-4 md:gap-6">
                <button
                  onClick={scrollToForm}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl font-black text-lg md:text-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  ابدأ رحلة الاستيراد الآن
                </button>
                <button
                  onClick={() => {
                    const section = document.getElementById("main-features");
                    if (section) section.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-zinc-800/50 hover:bg-zinc-700 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl font-bold text-lg md:text-xl backdrop-blur-sm border border-white/10 transition-all"
                >
                  لماذا دبي؟
                </button>
              </div>
            </div>

            {/* Right Side: The Premium Form */}
            <div id="lead-form-section" className="order-1 lg:order-2">
              <div className="bg-white rounded-[32px] md:rounded-[50px] shadow-[0_40px_120px_rgba(227,42,38,0.2)] p-6 md:p-10 lg:p-14 text-zinc-900 border-t-[12px] border-red-600">
                {isSuccess ? (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="w-28 h-28 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-10 text-6xl">
                      ✓
                    </div>
                    <h3 className="text-4xl font-black mb-6">تم تسجيل طلبك!</h3>
                    <p className="text-zinc-500 text-xl mb-12 leading-relaxed">
                      سيقوم أحد مستشارينا في فرع دبي بمراجعة طلبك والتواصل معك
                      هاتفياً قريباً جداً.
                    </p>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-red-600 font-bold text-xl hover:underline"
                    >
                      تقديم طلب استيراد آخر
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="mb-6 md:mb-10 text-center">
                      <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 tracking-tight">
                        طلب استشارة مجانية
                      </h2>
                      <p className="text-zinc-400 text-sm md:text-lg font-bold">
                        اترك بياناتك وسنقوم بالرد على كافة استفساراتك حول
                        الجمارك والشحن
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-sm font-bold border border-red-100 animate-fade-in">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-black text-zinc-500 block mr-3">
                        الاسم الثلاثي
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-6 md:px-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border border-zinc-100 focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none bg-zinc-50 transition-all text-base md:text-xl font-bold placeholder:text-zinc-300"
                        placeholder="أدخل اسمك بالكامل"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-zinc-500 block mr-3">
                        رقم الموبايل (واتساب)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-6 md:px-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border border-zinc-100 focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none bg-zinc-50 text-left transition-all text-base md:text-xl font-sans font-black placeholder:text-zinc-300"
                        placeholder="01xxxxxxxxx"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-2 w-full">
                      <label className="text-sm font-black text-zinc-500 block mr-3">
                        فئة السيارة
                      </label>
                      <select
                        name="carType"
                        value={formData.carType}
                        onChange={handleChange}
                        className="w-full px-6 md:px-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] border border-zinc-100 focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none bg-zinc-50 font-bold text-base md:text-lg appearance-none cursor-pointer"
                      >
                        <option>SUV → سيارة دفع رباعي</option>
                        <option>Sports → رياضي</option>
                        <option>Sedan → سيدان</option>
                        <option>VAN → فان / شاحنة صغيرة</option>
                        <option>Hatchback → هاتشباك</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 md:py-6 mt-6 rounded-[24px] md:rounded-[28px] bg-red-600 hover:bg-red-700 text-white font-black text-lg md:text-2xl shadow-[0_20px_60px_rgba(227,42,38,0.4)] transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "جاري إرسال الطلب..."
                        : "تأكيد طلب الاستشارة"}
                    </button>
                    <p className="text-center text-zinc-400 text-sm font-bold">
                      بإرسالك لهذا النموذج، فإنك توافق على سياسة الخصوصية الخاصة
                      بنا
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Steps Banner */}
      <div className="bg-red-600 py-8 shadow-2xl">
        <div className="container mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-32 text-white font-black text-xl md:text-2xl italic">
          <div className="flex items-center gap-4 hover:scale-105 transition-transform cursor-default">
            <span>🇦🇪</span> شراء مباشر
          </div>
          <div className="opacity-40 hidden md:block">»»»</div>
          <div className="flex items-center gap-4 hover:scale-105 transition-transform cursor-default">
            <span>🚢</span> شحن دولي
          </div>
          <div className="opacity-40 hidden md:block">»»»</div>
          <div className="flex items-center gap-4 hover:scale-105 transition-transform cursor-default">
            <span>🇪🇬</span> استلام في مصر
          </div>
        </div>
      </div>

      {/* Why Dubai Section */}
      <section id="main-features" className="py-24 md:py-32 bg-zinc-950">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-12 md:mb-16 text-white leading-tight text-center md:text-right">
            لماذا تشتري سيارتك من دبي عبر الطاس؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-10 bg-zinc-900/40 rounded-[32px] md:rounded-[40px] border border-zinc-800/50 hover:bg-zinc-900/60 transition-colors shadow-xl">
              <div className="text-4xl md:text-5xl text-red-600 shrink-0">
                💎
              </div>
              <div>
                <h4 className="text-xl md:text-2xl font-black text-white mb-3">
                  تنوع غير محدود
                </h4>
                <p className="text-base md:text-lg text-zinc-400 leading-relaxed">
                  سوق دبي يضم أحدث الموديلات والمواصفات التي قد لا تتوفر في
                  السوق المحلي، خاصة سيارات الزيرو والمستعملة بحالة الوكالة.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-10 bg-zinc-900/40 rounded-[32px] md:rounded-[40px] border border-zinc-800/50 hover:bg-zinc-900/60 transition-colors shadow-xl">
              <div className="text-4xl md:text-5xl text-red-600 shrink-0">
                🛡️
              </div>
              <div>
                <h4 className="text-xl md:text-2xl font-black text-white mb-3">
                  فحص فني شامل (SGS)
                </h4>
                <p className="text-base md:text-lg text-zinc-400 leading-relaxed">
                  نقوم بفحص السيارة في مراكز متخصصة وتزويدك بتقرير مفصل عن كل
                  قطعة قبل دفع درهم واحد.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-10 bg-zinc-900/40 rounded-[32px] md:rounded-[40px] border border-zinc-800/50 hover:bg-zinc-900/60 transition-colors shadow-xl">
              <div className="text-4xl md:text-5xl text-red-600 shrink-0">
                ⚓
              </div>
              <div>
                <h4 className="text-xl md:text-2xl font-black text-white mb-3">
                  لوجستيات متكاملة
                </h4>
                <p className="text-base md:text-lg text-zinc-400 leading-relaxed">
                  شحن بري سريع أو بحري مؤمن، مع إصدار شهادات المنشأ وفواتير
                  التصدير الموثقة لضمان حقك.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section - Full Width, Centered Title, Single Row */}
      <section className="py-24 md:py-32 bg-zinc-900/10 border-t border-zinc-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-20 text-white inline-block border-b-8 border-red-600 pb-6 rounded-sm">
            خطواتك للوصول للسيارة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-right">
            <StepCard
              number="01"
              title="تعبئة الطلب"
              desc="سجل بياناتك ونوع السيارة التي تبحث عنها والميزانية المحددة بكل دقة."
            />
            <StepCard
              number="02"
              title="الاستشارة"
              desc="يتصل بك خبيرنا لعرض الخيارات المتاحة في مزادات ومعارض دبي العالمية."
            />
            <StepCard
              number="03"
              title="الفحص والتعاقد"
              desc="بعد اختيارك، يتم فحص السيارة بشكل مستقل وإرسال تقرير فني مصور لك."
            />
            <StepCard
              number="04"
              title="الشحن والاستلام"
              desc="نشحن السيارة لميناء بورسعيد أو السخنة مع إنهاء كافة أوراق التصدير القانونية."
            />
          </div>
        </div>
      </section>

      {/* Import Insights Section */}
      <section className="py-24 md:py-32 bg-zinc-950 border-t border-zinc-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-20">
            معلومات هامة للمستورد المصري
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-right">
            <div className="p-10 bg-zinc-900 rounded-[40px] border border-zinc-800 shadow-xl hover:border-red-600/50 transition-all group">
              <h5 className="text-red-600 font-black mb-6 uppercase tracking-widest text-sm group-hover:scale-105 transition-transform">
                مبادرة المغتربين
              </h5>
              <p className="text-base text-zinc-400 leading-relaxed font-medium">
                نساعدك في اختيار سيارة تطابق شروط المبادرة والاستفادة من
                الإعفاءات الجمركية الكاملة بموجب الوديعة البنكية.
              </p>
            </div>
            <div className="p-10 bg-zinc-900 rounded-[40px] border border-zinc-800 shadow-xl hover:border-red-600/50 transition-all group">
              <h5 className="text-red-600 font-black mb-6 uppercase tracking-widest text-sm group-hover:scale-105 transition-transform">
                سيارات ذوي الهمم
              </h5>
              <p className="text-base text-zinc-400 leading-relaxed font-medium">
                تجهيز كافة الأوراق المطلوبة لسيارات المعاقين وفقاً للقانون
                المصري، مع ضمان شحن سيارة مجهزة بأحدث التقنيات.
              </p>
            </div>
            <div className="p-10 bg-zinc-900 rounded-[40px] border border-zinc-800 shadow-xl hover:border-red-600/50 transition-all group">
              <h5 className="text-red-600 font-black mb-6 uppercase tracking-widest text-sm group-hover:scale-105 transition-transform">
                السيارات الكهربائية
              </h5>
              <p className="text-base text-zinc-400 leading-relaxed font-medium">
                نصيحة الخبراء: السيارات الكهربائية في مصر تتمتع بإعفاءات جمركية
                واسعة، ونوفر لك أفضل الموديلات العالمية من دبي.
              </p>
            </div>
            <div className="p-10 bg-zinc-900 rounded-[40px] border border-zinc-800 shadow-xl hover:border-red-600/50 transition-all group">
              <h5 className="text-red-600 font-black mb-6 uppercase tracking-widest text-sm group-hover:scale-105 transition-transform">
                شهادة يورو 1
              </h5>
              <p className="text-base text-zinc-400 leading-relaxed font-medium">
                نوفر السيارات الأوروبية المنشأ في دبي مع التأكد من إمكانية
                استخراج الشهادات المطلوبة لخفض الجمارك لأقصى حد.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-24 border-t border-zinc-800">
        <div className="container mx-auto px-6 text-center">
          <img
            src={logo}
            alt="Altass Motors"
            className="h-14 mx-auto mb-12 opacity-90"
          />
          <div className="flex flex-wrap justify-center gap-14 mb-14 text-zinc-400 font-black text-lg">
            <button
              onClick={scrollToForm}
              className="hover:text-red-600 transition"
            >
              طلب تسعيرة
            </button>
            <a
              href="https://www.altassmotors.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-600 transition"
            >
              الموقع الرسمي
            </a>
            <button
              onClick={scrollToForm}
              className="hover:text-red-600 transition"
            >
              مستشاري دبي
            </button>
          </div>
          <div className="max-w-3xl mx-auto text-zinc-500 text-base leading-relaxed font-medium">
            تطبق الشروط والأحكام الخاصة بقوانين الجمارك المصرية. الطاس موتورز هي
            شركة مرخصة في دبي متخصصة في تجارة السيارات وتصديرها دولياً.
            <br />
            <br />
            جميع الحقوق محفوظة © {new Date().getFullYear()} الطاس موتورز.
          </div>
        </div>
      </footer>

      {/* Sticky Bottom CTA for Mobile */}
      {/* <div className="md:hidden fixed bottom-0 left-0 right-0 p-6 bg-black/60 backdrop-blur-2xl z-50 border-t border-white/5">
        <button
          onClick={scrollToForm}
          className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black text-2xl shadow-[0_10px_40px_rgba(227,42,38,0.5)] active:scale-95 transition-all"
        >
          سجل طلبك الآن
        </button>
      </div> */}
    </div>
  );
};

export default App;
