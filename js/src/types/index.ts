export * from './dataProvider'
//移植
export type IConstant<T> = {
	label: string;
	value: T;
	color?: string;
};

export type TTerm = {
	id: number;
	name: string;
	slug: string;
	term_type: string;
	color?: string;
};

export type TLineGridData = {
	date: string;
	value: number;
	category: string;
}[];

