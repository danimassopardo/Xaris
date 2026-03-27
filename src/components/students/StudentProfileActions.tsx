"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import EditStudentDialog from "./EditStudentDialog";

interface Student {
  id: number;
  name: string;
  studentId: string;
  course: string;
  notes: string;
}

export default function StudentProfileActions({ student }: { student: Student }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Edit className="h-4 w-4 mr-1" />
        Edit Student
      </Button>
      <EditStudentDialog student={student} open={open} onOpenChange={setOpen} />
    </>
  );
}
