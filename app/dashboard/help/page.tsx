
"use client";

import { useState } from "react";

const sections = [
  {
    title: "1. Getting Started",
    description: "Learn your way around ScholarFlow.",
    steps: [
      "Log in using your administrator account.",
      "The Overview page gives you access to the main school management features.",
      "Use the sidebar menu to move between Students, Classes, Subjects, Teachers, Results and Reports.",
      "Always confirm that you are working in the correct school workspace."
    ]
  },
  {
    title: "2. Set Up Your School",
    description: "Prepare your school information before entering records.",
    steps: [
      "Open Settings and review the available school configuration options.",
      "Confirm your school information.",
      "Set up the academic calendar and academic year using Academic Calendar.",
      "Check that the school information is correct before proceeding."
    ]
  },
  {
    title: "3. Create Classes",
    description: "Organise the different classes in your school.",
    steps: [
      "Open Classes.",
      "Create each class that your school needs.",
      "Enter the correct class name and available information.",
      "Review the class list to ensure that all classes have been created correctly."
    ]
  },
  {
    title: "4. Register Students",
    description: "Add students to their respective classes.",
    steps: [
      "Open Students.",
      "Register each student using the available form.",
      "Enter accurate student details.",
      "Assign the student to the correct class.",
      "Review student records and correct any mistakes."
    ]
  },
  {
    title: "5. Configure Subjects",
    description: "Prepare subjects and their coefficients.",
    steps: [
      "Open Subjects.",
      "Add the subjects taught in your school.",
      "Assign the correct subject category where applicable.",
      "Configure the appropriate coefficient for each subject.",
      "Review subjects marked as needing configuration before calculating results."
    ]
  },
  {
    title: "6. Manage Teachers",
    description: "Organise your teaching staff.",
    steps: [
      "Open Teachers.",
      "Add the required teacher records.",
      "Enter accurate teacher information.",
      "Review the teacher list and available assignments."
    ]
  },
  {
    title: "7. Assign Class Masters",
    description: "Connect class masters to their respective classes.",
    steps: [
      "Open Class Masters.",
      "Select the appropriate teacher.",
      "Assign the teacher to the correct class.",
      "Review assignments to avoid duplicate or incorrect class responsibilities."
    ]
  },
  {
    title: "8. Enter Marks and Calculate Results",
    description: "Record student performance carefully.",
    steps: [
      "Open Marks & Results.",
      "Select the appropriate class, academic period and examination.",
      "Select the relevant subjects.",
      "Enter each student's marks carefully.",
      "Check entered marks before saving or finalising them.",
      "Review calculated totals, averages and rankings.",
      "Correct any errors before using the results for reports."
    ]
  },
  {
    title: "9. Conduct Class Council",
    description: "Review student performance and council decisions.",
    steps: [
      "Open Class Council.",
      "Select the appropriate class and examination.",
      "Review student academic performance.",
      "Complete the available council information and decisions.",
      "Check remarks and other required details before finalising."
    ]
  },
  {
    title: "10. Generate and Print Reports",
    description: "Prepare student academic reports.",
    steps: [
      "Open Reports.",
      "Select the appropriate class and examination.",
      "Review the available student results.",
      "Generate the required reports.",
      "Check names, marks, averages, rankings and remarks.",
      "Download or print the reports using the available options."
    ]
  },
  {
    title: "11. Important Administrative Tips",
    description: "Keep your school records accurate and secure.",
    steps: [
      "Always enter correct student and teacher information.",
      "Avoid creating duplicate student records.",
      "Double-check marks before finalising results.",
      "Confirm subject coefficients before calculating averages.",
      "Do not share your administrator login details.",
      "Contact support if you encounter an error you cannot resolve."
    ]
  }
];

export default function HelpPage() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-5xl space-y-7">

      <div className="rounded-2xl bg-[#101d35] p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[2px] text-blue-300">
          SCHOLARFLOW USER GUIDE
        </p>

        <h1 className="mt-3 text-2xl font-black sm:text-3xl">
          Help & Support
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Welcome to ScholarFlow. This guide takes you through the
          main administrative tasks, from setting up your school
          to preparing and printing student reports.
        </p>

        <p className="mt-4 text-sm font-semibold text-blue-200">
          Follow the steps in order for a smooth experience.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#152440]">
          Administrative User Manual
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a section below to view its instructions.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => {
          const isOpen = openSection === index;

          return (
            <div
              key={section.title}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenSection(isOpen ? null : index)
                }
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
              >
                <div>
                  <h3 className="font-bold text-[#152440]">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {section.description}
                  </p>
                </div>

                <span className="text-xl text-blue-600">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5">
                  <ol className="space-y-4">
                    {section.steps.map((step, stepIndex) => (
                      <li
                        key={stepIndex}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-700"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {stepIndex + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Need further assistance?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Our support team is available to help you with
              questions, technical difficulties and system guidance.
            </p>

            <a
              href={`https://wa.me/237673864413?text=${encodeURIComponent(
                "Hello ScholarFlow Support, I need assistance with my school management system.\n\nSchool: \nMy name: \nMy issue: "
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Contact Support on WhatsApp
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      <p className="pb-4 text-center text-xs text-slate-400">
        ScholarFlow · Administrative Help Centre · Version 1.0
      </p>

    </div>
  );
}
