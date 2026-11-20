
export type AssessmentDefinition = {
  id: string;
  name: string;
  maxMark: number;
  order: number;
};

export type AssessmentMark = {
  assessmentId: string;
  assessmentName: string;
  mark: number | null;
  maxMark: number;
  order: number;
};

export type SubjectCalculation = {
  totalMark: number;
  totalMaximum: number;
  percentage: number | null;
  complete: boolean;
};

export function calculateSubjectResult(
  marks: AssessmentMark[],
  assessments: AssessmentDefinition[]
): SubjectCalculation {
  const totalMaximum = assessments.reduce(
    (sum, assessment) => sum + assessment.maxMark,
    0
  );

  const totalMark = assessments.reduce((sum, assessment) => {
    const entry = marks.find(
      (mark) => mark.assessmentId === assessment.id
    );
    return sum + (entry?.mark ?? 0);
  }, 0);

  const complete =
    assessments.length > 0 &&
    assessments.every((assessment) => {
      const entry = marks.find(
        (mark) => mark.assessmentId === assessment.id
      );
      return (
        entry?.mark !== null &&
        entry?.mark !== undefined &&
        Number.isFinite(entry.mark) &&
        entry.mark >= 0 &&
        entry.mark <= assessment.maxMark
      );
    });

  return {
    totalMark,
    totalMaximum,
    percentage:
      complete && totalMaximum > 0
        ? Number(((totalMark / totalMaximum) * 100).toFixed(2))
        : null,
    complete,
  };
}
