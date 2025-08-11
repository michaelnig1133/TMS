import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { HelpCircle, CheckCircle2, Bell, PenTool as Tool } from "lucide-react";

const ServiceCard = () => {
  const { mylanguage } = useLanguage();
  const { myTheme } = useTheme();

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.5, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
    },
    hover: {
      scale: 1.05,
      y: -10,
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
  };

  const cardsData = [
    {
      icon: <HelpCircle size={48} className="text-blue-500" strokeWidth={1.5} />,
      titleEN: "Simplified Requests",
      titleAM: "ቀላል ጥያቄዎች",
      textEN: "Easily submit transport requests through an intuitive, user-friendly interface, reducing time and effort.",
      textAM: "በቀላሉ ጥያቄዎችን በቀላል በሆነ ገፅ አቅርቡ፣ ጊዜን እና በአስቸጋሪነትን አንሳሳሉ።",
    },
    {
      icon: <CheckCircle2 size={48} className="text-green-500" strokeWidth={1.5} />,
      titleEN: "Streamlined Approvals",
      titleAM: "በቀላሉ ማጽደቅ",
      textEN: "Accelerate the approval process with automated workflows, ensuring quick and smooth decision-making.",
      textAM: "ተሻሽለው የተቀመጡትን ሥራ እንዲወጣ ማስፈጸሚያን በፍጥነት ያንሳሉ።",
    },
    {
      icon: <Bell size={48} className="text-yellow-500" strokeWidth={1.5} />,
      titleEN: "Real-Time Notifications",
      titleAM: "በቀላሉ ማሳወቂያዎች",
      textEN: "Stay updated with instant alerts on trip schedules, approvals, and vehicle status in real time.",
      textAM: "የተለያዩ የጉዞ ጊዜ ማሳወቂያዎችን በቀኝ ሰዓት አገኙ።",
    },
    {
      icon: <Tool size={48} className="text-purple-500" strokeWidth={1.5} />,
      titleEN: "Maintenance Management",
      titleAM: "የጠባቂነት አስተዳደር",
      textEN: "Streamline vehicle maintenance and refueling requests, ensuring timely and efficient handling.",
      textAM: "የመኪና ጠባቂነትን እና የእምነት ጥያቄዎችን በሰዓት አንሳሳሉ።",
    },
  ];

  return (
    <motion.div
      className="cards-grid"
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.2 }}
    >
      {cardsData.map(({ icon, titleEN, titleAM, textEN, textAM }, index) => (
        <motion.div
          key={index}
          variants={cardVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <div className="service-card">
            <div className="icon-container">
              {icon}
            </div>
            <h3 className="card-title">
              {mylanguage === "EN" ? titleEN : titleAM}
            </h3>
            <p className="card-text">
              {mylanguage === "EN" ? textEN : textAM}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ServiceCard;