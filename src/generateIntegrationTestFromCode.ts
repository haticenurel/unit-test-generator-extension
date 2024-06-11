import * as vscode from 'vscode';
import * as glob from 'glob';
import * as path from 'path';
import OpenAI from "openai";
import { generateUnitTestFromCode } from './generateUnitTestFromCode';

const openai = new OpenAI({ "" });


export async function generateIntegrationTests(code: string): Promise<{
    success: boolean,
    filePath: vscode.Uri | undefined
    fileName: string
}> {
    const prompt = `I have multiple C++ files that I want to test using Google Test.
Please generate Google Test integration tests for these code pieces providing necessary includes. Given the following code:\n\n${code}\n\nWrite integration tests for this code:`;
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "gpt-3.5-turbo",
        });


        const result = completion.choices[0].message.content;
        const data = result ? new TextEncoder().encode(result) : new Uint8Array();
        // Get the workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            console.error('No workspace folder open');
            return { success: false, filePath: undefined, fileName: '' };
        }

        const workspaceFolder = workspaceFolders[0];
        const workspacePath = workspaceFolder.uri.fsPath;

        // Find all C++ files in the workspace
        const cppFiles = glob.sync('**/*.cpp', { cwd: workspacePath });

        for (const cppFile of cppFiles) {
            // Read the C++ file
            const filePath = path.join(workspacePath, cppFile);
            const fileUri = vscode.Uri.file(filePath);
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const fileContentStr = new TextDecoder().decode(fileContent);

            // Generate a test for the C++ file
            const testResult = await generateUnitTestFromCode(fileContentStr, cppFile);
            if (!testResult.success) {
                console.error(`Failed to generate test for ${cppFile}`);
                continue;
            } else {
                vscode.window.showInformationMessage('Integration tests generated at: ' + testResult.filePath);
                if (!testResult.filePath) {
                    continue;
                }
                vscode.workspace.openTextDocument(testResult.filePath).then(doc => {
                    vscode.window.showTextDocument(doc);
                });

            }
            // Write the test to a new file
            const testFilePath = path.join(workspacePath, 'tests', `${testResult.fileName}_integration_test.cpp`);
            const testFileUri = vscode.Uri.file(testFilePath);
            await vscode.workspace.fs.writeFile(testFileUri, new TextEncoder().encode(testResult.fileName));

            return { success: true, fileName: testResult.fileName, filePath: testFileUri };
        }
    }
    catch (error) {
        console.error('Error:', error);
        return { success: false, filePath: undefined, fileName: '' };
    }

    return { success: false, filePath: undefined, fileName: '' };
}

   