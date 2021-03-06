import { CELL_DATA_TYPE_SUPERTYPES, CELL_DATA_TYPES } from '../isValid';
import { parseExcelRow } from '../parseExcelRow';
import { CellDataType, ExcelRow, IgnoreRowIf, ParseColumnOptions, ParseRowOptions } from '../types';


const samplePermittedValueLists = {
  boolean: [true],
  date: [new Date(2018, 0, 1), new Date(2019, 0, 1)],
  integer: [-1, 1],
  number: [-1.5, 1.5],
  string: ['allowed', 'also allowed'],
};
const sampleNonpermittedValues = {
  boolean: false,
  date: new Date(1918, 0, 1),
  integer: 0.5,
  number: 0,
  string: 'not allowed',
};
const samplePermittedValues = {
  boolean: true,
  date: new Date(2018, 0, 1),
  integer: -1,
  number: 1.5,
  string: 'allowed',
};


describe('parseExcelRow()', () => {
  describe('when `dataType` is set for a column', () => {
    it('if the cell has the correct type, should succeed', () => {
      CELL_DATA_TYPES.forEach((dataType: CellDataType) => {
        const rowOptions: ParseRowOptions = {
          columns: { A: { dataType } },
        };
        const value = samplePermittedValues[dataType];
        const excelRow: ExcelRow = { A: value };
        const parsedRow = parseExcelRow(excelRow, rowOptions);
        expect(parsedRow).toEqual({ A: value });
      });
    });

    it('if a cell has the wrong type, should throw an error', () => {
      CELL_DATA_TYPES.forEach((dataType: CellDataType) => {
        CELL_DATA_TYPES
          .filter((valueDataType) => valueDataType !== dataType)
          .filter((valueDataType) => {
            const supertypes = CELL_DATA_TYPE_SUPERTYPES[valueDataType] || [];
            return !supertypes.includes(dataType);
          })
          .forEach((valueDataType) => {
            const rowOptions: ParseRowOptions = {
              columns: { A: { dataType } },
            };
            const value = samplePermittedValues[valueDataType];
            const excelRow: ExcelRow = { A: value };
            expect(() => {
              parseExcelRow(excelRow, rowOptions);
            }).toThrow();
          });
      });
      const rowOptions: ParseRowOptions = {
        columns: { A: { dataType: 'number' } },
      };
      const excelRow: ExcelRow = { A: 'string' };
      expect(() => {
        parseExcelRow(excelRow, rowOptions);
      }).toThrow();
    });

    it('if a cell is empty and empty cells are disallowed in the row, should throw an error', () => {
      CELL_DATA_TYPES.forEach((dataType: CellDataType) => {
        const rowOptions: ParseRowOptions = {
          columns: { A: { dataType } },
          disallowEmptyCellsInRow: true,
        };
        const excelRow: ExcelRow = { A: undefined };
        expect(() => {
          parseExcelRow(excelRow, rowOptions);
        }).toThrow();
      });
    });

    it('if a cell is empty and empty cells are allowed in the row, should use a null value for that cell', () => {
      CELL_DATA_TYPES.forEach((dataType: CellDataType) => {
        const rowOptions: ParseRowOptions = {
          columns: { A: { dataType } },
          disallowEmptyCellsInRow: false,
        };
        const excelRow: ExcelRow = { A: undefined };
        const parsedRow = parseExcelRow(excelRow, rowOptions);
        expect(parsedRow).toEqual({ A: null });
      });
    });
  });


  describe("when `ignoreRowIf='empty'` for a column", () => {
    const rowOptions: ParseRowOptions = {
      columns: {
        A: { ignoreRowIf: 'empty' },
        B: {},
      },
    };

    it('if a cell in that column is empty and no default value is set, should skip the row', () => {
      const excelRow: ExcelRow = {
        A: undefined,
        B: 2,
      };
      const jsonRow = parseExcelRow(excelRow, rowOptions);
      expect(jsonRow).toEqual(null);
    });

    it('if a cell in that column has truthy content, should not skip the row', () => {
      const excelRow: ExcelRow = {
        A: 1,
        B: 2,
      };
      const jsonRow = parseExcelRow(excelRow, rowOptions);
      expect(jsonRow).toEqual({ A: 1, B: 2 });
    });
  });

  describe("when `ignoreRowIf='falsy'` for a column, `disallowEmptyCellsInColumn` should be ignored and", () => {
    [
      { ignoreRowIf: 'falsy' as IgnoreRowIf },
      /* DEPRECATED: Remove this test when `ignoreRowIfFalsy` is no longer supported. */
      { ignoreRowIfFalsy: true },
    ].forEach((ignoreIfSetting) => {
      const rowOptions: ParseRowOptions = {
        columns: {
          A: { ...ignoreIfSetting },
          B: {},
        },
      };

      it('if a cell in that column is empty, the row should be skipped', () => {
        const excelRow: ExcelRow = {
          A: undefined,
          B: 2,
        };
        const jsonRow = parseExcelRow(excelRow, rowOptions);
        expect(jsonRow).toEqual(null);
      });

      it('if a cell in that column has falsy content, the row should be skipped', () => {
        const excelRow: ExcelRow = {
          A: 0,
          B: 2,
        };
        const jsonRow = parseExcelRow(excelRow, rowOptions);
        expect(jsonRow).toEqual(null);
      });

      it('if a cell in that column has truthy content, the row should not be skipped', () => {
        const excelRow: ExcelRow = {
          A: 1,
          B: 2,
        };
        const jsonRow = parseExcelRow(excelRow, rowOptions);
        expect(jsonRow).toEqual({ A: 1, B: 2 });
      });
    });
  });

  describe("when `ignoreRowIf='truthy'` for a column", () => {
    [
      { ignoreRowIf: 'truthy' as IgnoreRowIf },
      /* DEPRECATED: Remove this test when `ignoreRowIfTruthy` is no longer supported. */
      { ignoreRowIfTruthy: true },
    ].forEach((ignoreIfSetting) => {
      const rowOptions: ParseRowOptions = {
        columns: {
          A: { ...ignoreIfSetting },
          B: {},
        },
      };

      it('if a cell in that column has content, should skip the row', () => {
        const excelRow: ExcelRow = {
          A: 1,
          B: 2,
        };
        const jsonRow = parseExcelRow(excelRow, rowOptions);
        expect(jsonRow).toEqual(null);
      });

      it('if a cell in that column is empty, `disallowEmptyCellsInColumn` should be ignored and the row should not be skipped', () => {
        const excelRow: ExcelRow = {
          A: undefined,
          B: 2,
        };
        const jsonRow = parseExcelRow(excelRow, rowOptions);
        expect(jsonRow).toEqual({ A: null, B: 2 });
      });

      it('if a cell in that column is falsy, should not skip the row', () => {
        const falsyValues = [0, ''];
        falsyValues.forEach((falsyValue) => {
          const excelRow: ExcelRow = { A: falsyValue, B: 2 };
          const jsonRow = parseExcelRow(excelRow, rowOptions);
          expect(jsonRow).toEqual({ A: falsyValue, B: 2 });
        });
      });
    });
  });

  describe('when a cell is empty', () => {
    it('if `defaultValue` is set, `disallowEmptyCellsInColumn` and `ignoreRowIf` should be ignored and the cell should get the default value without transformations', () => {
      const toUpperCase = (str: string): string => str.toUpperCase();
      const rowOptions: ParseRowOptions = {
        columns: {
          A: {
            cellTransformers: [toUpperCase],
            defaultValue: 'transforms are not applied',
            disallowEmptyCellsInColumn: true,
            ignoreRowIf: 'empty',
          },
          B: { cellTransformers: [toUpperCase] },
        },
      };
      const excelRow: ExcelRow = {
        A: undefined,
        B: 'transforms are applied',
      };
      const jsonRow = parseExcelRow(excelRow, rowOptions);
      /* Note that the `cellTransformers` are skipped. */
      expect(jsonRow).toEqual({ A: 'transforms are not applied', B: 'TRANSFORMS ARE APPLIED' });
    });

    it('if `defaultValue` and `ignoreRowIf` are not set and empty cells are disallowed, an error should be thrown', () => {
      const rowOptions: ParseRowOptions = {
        columns: {
          A: { disallowEmptyCellsInColumn: true },
        },
      };
      const excelRow: ExcelRow = {
        A: undefined,
      };
      expect(() => {
        parseExcelRow(excelRow, rowOptions);
      }).toThrow();
    });

    it('if `defaultValue` and `ignoreRowIf` are not set and empty cells are allowed, the cell should get the value `null`', () => {
      const rowOptions: ParseRowOptions = {
        columns: {
          A: { disallowEmptyCellsInColumn: false },
        },
      };
      const excelRow: ExcelRow = {
        A: undefined,
      };
      const jsonRow = parseExcelRow(excelRow, rowOptions);
      expect(jsonRow).toEqual({ A: null });
    });
  });

  describe('when `permittedValues` is set for a column', () => {
    it('if the cell has a permitted value, should succeed', () => {
      CELL_DATA_TYPES.forEach((dataType: CellDataType) => {
        const permittedValues = samplePermittedValueLists[dataType];
        const rowOptions: ParseRowOptions = {
          columns: { A: { dataType, permittedValues } },
        };
        const value = samplePermittedValues[dataType];
        const excelRow: ExcelRow = { A: value };
        const parsedRow = parseExcelRow(excelRow, rowOptions);
        expect(parsedRow).toEqual({ A: value });
      });
    });

    it('if the cell has a nonpermitted value, should throw an error', () => {
      CELL_DATA_TYPES.forEach((dataType: CellDataType) => {
        const permittedValues = samplePermittedValueLists[dataType];
        const rowOptions: ParseRowOptions = {
          columns: { A: { dataType, permittedValues } },
        };
        const value = sampleNonpermittedValues[dataType];
        const excelRow: ExcelRow = { A: value };
        expect(() => {
          parseExcelRow(excelRow, rowOptions);
        }).toThrow();
      });
    });
  });

  describe('when `cellValidators` are set for a column', () => {
    const alwaysFails = (): boolean => false;
    const alwaysPasses = (): boolean => true;

    it('if all validators pass, should succeed', () => {
      const cellValidators = [alwaysPasses, alwaysPasses];
      const rowOptions: ParseRowOptions = {
        columns: { A: { cellValidators, dataType: 'string' } },
      };
      const excelRow: ExcelRow = { A: 'string' };
      const parsedRow = parseExcelRow(excelRow, rowOptions);
      expect(parsedRow).toEqual({ A: 'string' });
    });

    it('if any validator fails, an error should be thrown', () => {
      const cellValidators = [alwaysPasses, alwaysFails];
      const rowOptions: ParseRowOptions = {
        columns: { A: { cellValidators, dataType: 'string' } },
      };
      const excelRow: ExcelRow = { A: 'string' };
      expect(() => {
        parseExcelRow(excelRow, rowOptions);
      }).toThrow();
    });

    it('if the cell is empty & a default value is defined, validators should be skipped', () => {
      const cellValidators = [alwaysFails];
      const rowOptions: ParseRowOptions = {
        columns: { A: { cellValidators, dataType: 'string', defaultValue: null } },
      };
      const excelRow: ExcelRow = { A: undefined };
      const parsedRow = parseExcelRow(excelRow, rowOptions);
      expect(parsedRow).toEqual({ A: null });
    });

    it('if ignoreRowIfFalsy=true and the cell has content, validators should be run', () => {
      const cellValidators = [alwaysFails];
      const rowOptions: ParseRowOptions = {
        columns: {
          A: {
            cellValidators,
            dataType: 'string',
            ignoreRowIfFalsy: true,
          },
        },
      };
      const excelRow: ExcelRow = { A: 'name' };
      expect(() => {
        parseExcelRow(excelRow, rowOptions);
      }).toThrow();
    });
  });

  describe('when `excludeThisColumn=true`', () => {
    it('the cell should never be included in the output', () => {
      const excelRow: ExcelRow = { A: 0, B: undefined };
      const columnOptions: Partial<ParseColumnOptions>[] = [
        { defaultValue: 1 },
        { ignoreRowIf: 'truthy' },
        { disallowEmptyCellsInColumn: true },
      ];
      columnOptions.forEach((options) => {
        const rowOptions = {
          columns: {
            A: {
              ...options,
              excludeThisColumn: true,
            },
            B: {
              ...options,
              excludeThisColumn: true,
            },
          },
        };
        const parsedRow = parseExcelRow(excelRow, rowOptions);
        expect(parsedRow).toEqual({});
      });
    });
  });

  /* TODO: Rewrite this test for readability. */
  describe('when `cellPrevalidationTransformers` is set', () => {
    it('cell values should be transformed before validation', () => {
      const rowOptions: ParseRowOptions = {
        columns: {
          A: {
            cellPrevalidationTransformers: [(val: number) => val + 1],
            cellValidators: [(val: number) => val === 1],
            cellTransformers: [(val: number) => val + 1],
          },
        },
      };
      const excelRow: ExcelRow = { A: 0 };
      const parsedRow = parseExcelRow(excelRow, rowOptions);
      expect(parsedRow).toEqual({ A: 2 });
    });
  });
});
