import * as vscode from 'vscode';
import OpenAI from "openai";
const openai = new OpenAI({ "" });

export async function generateUnitTestFromCode(code: string, editorDocumentFileName: string): Promise<{
  success: boolean,
  filePath: vscode.Uri | undefined
  fileName: string
}> {
  const prompt = `I have a C++ file that I want to test using Google Test.
Please generate a Google Test unit test for this code piece providing neceserray includes. Given the following code:\n\n${code}\n\nWrite a unit test for this code:`;
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const res = completion.choices[0].message.content;
    const data = res ? new TextEncoder().encode(res) : new Uint8Array();

    const filePath = await getFilePath(editorDocumentFileName);
    await vscode.workspace.fs.writeFile(filePath.filePath, data);
    return { success: true, fileName: filePath.fileName, filePath: filePath.filePath };
  } catch (error) {
    console.log('Failed to generate unit test:', error);
    return { success: false, filePath: undefined, fileName: '' };
  }
}

export async function getFilePath(fileName: string): Promise<{
  fileName: string,
  filePath: vscode.Uri
}> {
  const testFilename = fileName.split('/')[fileName.split('/').length - 1].split('.')[0] + '_unit_test.cpp';
  const filePath = fileName.split('/').slice(0, -1).join('/') + '/' + testFilename;
  const newFilePath = vscode.Uri.file(filePath);
  return { fileName: testFilename, filePath: newFilePath };
}
