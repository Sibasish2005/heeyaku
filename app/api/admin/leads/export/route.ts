import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertAdminAccess } from '@/lib/auth/admin';
import { formatLeadsForExport } from '@/lib/lead/export';
import * as XLSX from 'xlsx';
import { LeadStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await assertAdminAccess();

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const assignment = searchParams.get('assignment');
    const search = searchParams.get('search');

    // Build database filters
    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL' && Object.values(LeadStatus).includes(status as LeadStatus)) {
      where.status = status as LeadStatus;
    }

    if (employeeId && employeeId !== 'ALL') {
      if (employeeId === 'UNASSIGNED') {
        where.assignedEmployeeId = null;
      } else {
        where.assignedEmployeeId = employeeId;
      }
    }

    if (assignment === 'ASSIGNED') {
      where.assignedEmployeeId = { not: null };
    } else if (assignment === 'UNASSIGNED') {
      where.assignedEmployeeId = null;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
        { leadCode: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedEmployee: {
          select: {
            employeeCode: true,
            name: true,
          },
        },
      },
    });

    const exportData = leads.map((l) => ({
      leadCode: l.leadCode,
      name: l.name,
      phoneNumber: l.phoneNumber,
      email: l.email,
      company: l.company,
      source: l.source,
      status: l.status,
      assignedEmployeeCode: l.assignedEmployee?.employeeCode || null,
      assignedEmployeeName: l.assignedEmployee?.name || null,
      assignedAt: l.assignedAt,
      createdAt: l.createdAt,
      notes: l.notes,
    }));

    const formatted = formatLeadsForExport(exportData);
    const worksheet = XLSX.utils.json_to_sheet(formatted);

    // Column widths
    const colWidths = Object.keys(formatted[0] || {}).map((key) => ({
      wch: Math.max(key.length, 14),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HEEYAKU_Leads');

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="HEEYAKU_Leads_${timestamp}.csv"`,
        },
      });
    }

    // Default: XLSX
    const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="HEEYAKU_Leads_${timestamp}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error in leads export route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 403 }
    );
  }
}
